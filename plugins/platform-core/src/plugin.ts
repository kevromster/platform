//
// Copyright © 2020 Anticrm Platform Contributors.
// 
// Licensed under the Eclipse Public License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License. You may
// obtain a copy of the License at https://www.eclipse.org/legal/epl-2.0
// 
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// 
// See the License for the specific language governing permissions and
// limitations under the License.
//

import type { Platform } from '@anticrm/platform'
import {
  Ref, Class, Doc, AnyLayout, MODEL_DOMAIN, CoreProtocol, Tx, TITLE_DOMAIN, BACKLINKS_DOMAIN,
  VDoc, Space, generateId as genId, CreateTx, Property, PropertyType, ModelIndex, DateProperty, StringProperty, UpdateTx, mixinKey
} from '@anticrm/core'
import { ModelDb } from './modeldb'

import core, { CoreService, QueryResult } from '.'
import login from '@anticrm/login'
import rpcService from './rpc'

// TODO: bad dependency?
import contact, { User } from '@anticrm/contact'

import { TxProcessor, VDocIndex, TitleIndex, TextIndex, TxIndex } from '@anticrm/core'

import { QueriableStorage } from './queries'

import { Cache } from './cache'
import { Titles } from './titles'
import { Graph } from './graph'

/*!
 * Anticrm Platform™ Core Plugin
 * © 2020 Anticrm Platform Contributors. All Rights Reserved.
 * Licensed under the Eclipse Public License, Version 2.0
 */
export default async (platform: Platform): Promise<CoreService> => {
  const rpc = rpcService(platform)

  const coreProtocol: CoreProtocol = {
    find: (_class: Ref<Class<Doc>>, query: AnyLayout): Promise<Doc[]> => rpc.request('find', _class, query),
    findOne: (_class: Ref<Class<Doc>>, query: AnyLayout): Promise<Doc | undefined> => rpc.request('findOne', _class, query),
    tx: (tx: Tx): Promise<void> => rpc.request('tx', tx),
    loadDomain: (domain: string): Promise<Doc[]> => rpc.request('loadDomain', domain),
  }

  // Storages

  const model = new ModelDb()
  const titles = new Titles()
  const graph = new Graph()
  const cache = new Cache(coreProtocol)

  model.loadModel(await coreProtocol.loadDomain(MODEL_DOMAIN))

  const qModel = new QueriableStorage(model)
  const qTitles = new QueriableStorage(titles)
  const qGraph = new QueriableStorage(graph)
  const qCache = new QueriableStorage(cache)

  const domains = new Map<string, QueriableStorage>()
  domains.set(MODEL_DOMAIN, qModel)
  domains.set(TITLE_DOMAIN, qTitles)
  domains.set(BACKLINKS_DOMAIN, qGraph)

  const txProcessor = new TxProcessor([
    new TxIndex(qCache),
    new VDocIndex(model, qCache),
    new TitleIndex(model, qTitles),
    new TextIndex(model, qGraph),
    new ModelIndex(model, qModel)
  ])

  // add listener to process data updates from backend
  rpc.addEventListener(response => txProcessor.process(response.result as Tx))

  function find<T extends Doc> (_class: Ref<Class<T>>, query: AnyLayout): Promise<T[]> {
    const domainName = model.getDomain(_class)
    const domain = domains.get(domainName)
    if (domain) {
      return domain.find(_class, query)
    }
    return cache.find(_class, query)
  }

  function findOne<T extends Doc> (_class: Ref<Class<T>>, query: AnyLayout): Promise<T | undefined> {
    return find(_class, query).then(docs => docs.length === 0 ? undefined : docs[0])
  }

  function query<T extends Doc> (_class: Ref<Class<T>>, query: AnyLayout): QueryResult<T> {
    const domainName = model.getDomain(_class)
    const domain = domains.get(domainName)
    if (domain) {
      return domain.query(_class, query)
    }
    return qCache.query(_class, query)
  }

  function generateId () { return genId() as Ref<Doc> }

  function createDoc<T extends Doc> (doc: T): Promise<any> {
    if (!doc._id) {
      doc._id = generateId()
    }

    const tx: CreateTx = {
      _class: core.class.CreateTx,
      _id: generateId() as Ref<Doc>,
      _date: Date.now() as Property<number, Date>,
      _user: platform.getMetadata(login.metadata.WhoAmI) as Property<string, string>,
      object: doc
    }

    return Promise.all([coreProtocol.tx(tx), txProcessor.process(tx)])
  }

  function createVDoc<T extends VDoc> (vdoc: T): Promise<void> {
    if (!vdoc._createdBy) {
      vdoc._createdBy = platform.getMetadata(login.metadata.WhoAmI) as StringProperty
    }
    if (!vdoc._createdOn) {
      vdoc._createdOn = Date.now() as DateProperty
    }
    return createDoc(vdoc)
  }

  function createSpace (name: string): Promise<any> {
    const currentUser = platform.getMetadata(login.metadata.WhoAmI) as StringProperty
    const spaceId = generateId()

    const space = {
      _id: spaceId,
      _class: core.class.Space,
      _space: spaceId, // the space is available to itself
      name,
      users: [currentUser]
    }

    console.log(`createSpace '${name}' with Id '${spaceId}'`)

    return createVDoc(space as unknown as VDoc).then(() => addUserToSpace(currentUser, spaceId as Ref<Space>, true))
      /*return findOne(contact.mixin.User, { account: currentUser }).then(u => {
        const userToChange: User = u as User
        const spacesKey: string = mixinKey(contact.mixin.User, 'spaces')
        const spaces = (userToChange as any)[spacesKey]
        spaces.push(spaceId as Ref<Space>)
        const updateAttrs: any = {}
        updateAttrs[spacesKey] = spaces

        // need update User object
        const tx: UpdateTx = {
          _objectId: userToChange._id,
          _objectClass: userToChange._class,
          _attributes: updateAttrs,

          _date: Date.now() as DateProperty,
          _user: platform.getMetadata(login.metadata.WhoAmI) as StringProperty,

          _class: core.class.UpdateTx,
          _id: generateId()
        }
        return Promise.all([coreProtocol.tx(tx), txProcessor.process(tx)])
      })
    })*/
  }

  function addUserToSpace (account: string, space: Ref<Space>, avoidAddSpaceToUser?: boolean): Promise<any> {
    return findOne(contact.mixin.User, { account: account as StringProperty }).then(user => {
      if (user) {
        const spacesKey: string = mixinKey(contact.mixin.User, 'spaces')
        const spaces = (user as any)[spacesKey]

        if (spaces.indexOf(space) >= 0) {
          // the user already has this space, nothing to do
          return
        }

        spaces.push(space)
        const updateAttrs: any = {}
        updateAttrs[spacesKey] = spaces

        const tx: UpdateTx = {
          _objectId: user._id,
          _objectClass: user._class,
          _attributes: updateAttrs,

          _date: Date.now() as DateProperty,
          _user: platform.getMetadata(login.metadata.WhoAmI) as StringProperty,

          _class: core.class.UpdateTx,
          _id: generateId()
        }

        return Promise.all([coreProtocol.tx(tx), txProcessor.process(tx)])
      }
    }).then(() => {
      if (!avoidAddSpaceToUser) {
        // find space and add the user to the list
        return findOne(core.class.Space, { _id: space }).then(space => {
          if (space) {
            const users = space.users ?? []

            if (users.indexOf(account) >= 0) {
              // the space already has this user, nothing to do
              return
            }
            users.push(account)

            const tx: UpdateTx = {
              _objectId: space._id,
              _objectClass: space._class,
              _attributes: { users },
    
              _date: Date.now() as DateProperty,
              _user: platform.getMetadata(login.metadata.WhoAmI) as StringProperty,
    
              _class: core.class.UpdateTx,
              _id: generateId()
            }

            return Promise.all([coreProtocol.tx(tx), txProcessor.process(tx)])
          }
        })
      }
    })
  }

  return {
    getModel () { return model },
    query,
    find,
    findOne,
    createVDoc,
    createSpace,
    addUserToSpace,
    generateId
  }

}
