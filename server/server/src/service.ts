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

import { MongoClient, Db } from 'mongodb'

import { Ref, Class, Doc, Model, AnyLayout, MODEL_DOMAIN, CoreProtocol, Tx, TxProcessor, Storage, ModelIndex, StringProperty, Space, mixinKey, SpaceIndex, CORE_CLASS_CREATETX, CreateTx, CORE_CLASS_SPACE, UpdateTx, CORE_CLASS_UPDATETX } from '@anticrm/core'
import { VDocIndex, TitleIndex, TextIndex, TxIndex } from '@anticrm/core'
import contact, { User } from '@anticrm/contact'

import WebSocket from 'ws'
import { makeResponse, Response } from './rpc'
import { PlatformServer } from './server'


interface CommitInfo {
  created: Doc[]
}

export interface ClientControl {
  ping (): Promise<void>
  send (response: Response<unknown>): void
  shutdown (): Promise<void>
  account () : string
  //getUserSpaces () : Promise<Ref<Space>[]>
  getUserSpaces () : Ref<Space>[]
  addSpace (space: Ref<Space>): void
}

export async function connect (uri: string, dbName: string, account: string, ws: WebSocket, server: PlatformServer): Promise<CoreProtocol & ClientControl> {
  console.log('connecting to ' + uri.substring(25))
  console.log('use dbName ' + dbName)
  console.log('connected client account ' + account)
  const client = await MongoClient.connect(uri, { useUnifiedTopology: true })
  const db = client.db(dbName)

  const userSpaces: Ref<Space>[] = []

  const memdb = new Model(MODEL_DOMAIN)
  console.log('loading model...')
  const model = await db.collection('model').find({ _space: { $in: /*await*/ getUserSpaces(true) }}).toArray()
  console.log('model loaded.')
  memdb.loadModel(model)



  // TODO: account may be added to new spaces!
  /*const foundAccounts = await rawFind('mixin:contact.User' as Ref<Class<Doc>>, { account: account as StringProperty })

  let filteringSpaces = [null, undefined]
  if (foundAccounts && foundAccounts.length > 0 && 'spaces|mixin:contact~User' in foundAccounts[0]) {
    filteringSpaces = filteringSpaces.concat((foundAccounts[0] as any)['spaces|mixin:contact~User'])
  }

  console.log('filteringSpaces to be used:', filteringSpaces)*/

  //const filteringSpaces = foundAccounts && foundAccounts.length > 0 && 'spaces|mixin:contact~User' in foundAccounts[0] ? (foundAccounts[0] as any)['spaces|mixin:contact~User'] : []

  // const graph = new Graph(memdb)
  // console.log('loading graph...')
  // db.collection(CoreDomain.Tx).find({}).forEach(tx => graph.updateGraph(tx), () => console.log(graph.dump()))
  // console.log('graph loaded.')

  //async function getUserSpaces (isFirstTime?: boolean): Promise<Ref<Space>[]> {
  function getUserSpaces (isFirstTime?: boolean): Ref<Space>[] {

    // TODO: decide what to do with pre-created General and Random spaces
    let filteringSpaces: Ref<Space>[] = [null as unknown as Ref<Space>, undefined as unknown as Ref<Space>, 'space:workbench.General' as Ref<Space>, 'space:workbench.Random' as Ref<Space>]

    /*const user = await (isFirstTime ? findUserFirstTime() : findDoc(contact.mixin.User, { account: account as StringProperty }))
    const spacesKey = mixinKey(contact.mixin.User, 'spaces')

    if (user && spacesKey in user) {
      filteringSpaces = filteringSpaces.concat((user as any)[spacesKey])
    }

    return filteringSpaces
    */

    return filteringSpaces.concat(userSpaces ?? [])
  }

  function findUserFirstTime(): Promise<User|null> {
    // can't use memdb here because it isn't initialized yet
    const accountKey = mixinKey(contact.mixin.User, 'account')
    const mongoQuery: any = { _class: 'class:contact.Person' }
    mongoQuery[accountKey] = account
    return db.collection('contact').findOne(mongoQuery)
  }

  function findDoc (_class: Ref<Class<Doc>>, query: AnyLayout): Promise<Doc|null> {
    const domain = memdb.getDomain(_class)
    const cls = memdb.getClass(_class)
    const q = {}
    memdb.assign(q, _class, query)
    return db.collection(domain).findOne({ ...q, _class: cls })
  }

  async function find (_class: Ref<Class<Doc>>, query: AnyLayout): Promise<Doc[]> {
    console.log('account in find():', account)
    // TODO:
    // У Аккаунта взять список спейсов, куда он входит. 
    // Добавить в фильтр поиска ограничение на то, чтобы у найденных объектов была принадлежность к данному спейсу (у всех VDoc есть поле _space)

    /*if ('_space' in query) {
      // check that space
      const querySpace = query._space as any
      if (querySpace in filteringSpaces) {
        // OK, use that filter to query
      } else {
        // the requested space is NOT in the list of available to the user!
      }
    } else {
      // no space filter request, use filteringSpaces
      query._space = { $in: filteringSpaces }
    }*/

    const domain = memdb.getDomain(_class)
    const cls = memdb.getClass(_class)
    const q = {}
    memdb.assign(q, _class, query)

    // _space у документа: либо undefined|null, либо входит в filteringSpace, иначе объект выбрасывается из результата
    //{ $elemMatch : { memory_speed : "336 Gbps"} }

    const mongoQuery = { ...q, _class: cls}

    const filteringSpaces = /*await*/ getUserSpaces()
    //console.log('got filtering spaces:', filteringSpaces)

    if ('_space' in mongoQuery) {
      // check user-given '_space' filter
      const querySpace = mongoQuery['_space']

      if (filteringSpaces.indexOf(querySpace) >= 0) {
        // OK, use that filter to query
      } else {
        // the requested space is NOT in the list of available to the user!
        console.log('return EMPTY promise!!!!!!!')
        return Promise.resolve([])
      }
    } else {
      // no user-given '_space' filter, use all spaces available to the user
      (mongoQuery as any)['_space'] = { $in: filteringSpaces }
    }

    /*if (!('_space' in mongoQuery)) {
      (mongoQuery as any)['_space'] = { $in: filteringSpaces }
    } else {
      // check that space
      const querySpace = mongoQuery._space as any
      if (querySpace in filteringSpaces) {
        // OK, use that filter to query
      } else {
        // the requested space is NOT in the list of available to the user!
        return []
      }
    }*/

    //console.log('mongoQuery:', mongoQuery)

    return db.collection(domain).find(mongoQuery).toArray()
    //return db.collection(domain).find({ ...q, _class: cls}).filter({_space: { $in: filteringSpaces }}).toArray()

    /*const theQ = { _space: { $in: filteringSpaces }, ...q, _class: cls}
    console.log('mongo query:', theQ)
    return db.collection(domain).find(theQ).toArray()*/
  }

  const mongoStorage: Storage = {
    async store (doc: Doc): Promise<any> {
      const domain = memdb.getDomain(doc._class)
      console.log('STORE:', domain, doc)
      return db.collection(domain).insertOne(doc)
    },

    async push (_class: Ref<Class<Doc>>, _id: Ref<Doc>, attribute: string, attributes: any): Promise<any> {
      const domain = memdb.getDomain(_class)
      return db.collection(domain).updateOne({ _id }, { $push: { [attribute]: attributes } })
    },

    async update (_class: Ref<Class<Doc>>, selector: object, attributes: any): Promise<any> {
      const domain = memdb.getDomain(_class)
      return db.collection(domain).updateOne(selector, { $set: attributes })
    },

    async remove (_class: Ref<Class<Doc>>, doc: Ref<Doc>): Promise<any> {
      throw new Error('Not implemented')
    },

    async find<T extends Doc> (_class: Ref<Class<T>>, query: AnyLayout): Promise<T[]> {
      throw new Error('find not implemented')
    }
  }

  const txProcessor = new TxProcessor([
    new TxIndex(mongoStorage),
    new SpaceIndex(memdb, mongoStorage, account),
    new VDocIndex(memdb, mongoStorage),
    new TitleIndex(memdb, mongoStorage),
    new TextIndex(memdb, mongoStorage),
    new ModelIndex(memdb, mongoStorage)
  ])

  const clientControl = {

    // C O R E  P R O T O C O L

    find,

    findOne (_class: Ref<Class<Doc>>, query: AnyLayout): Promise<Doc | undefined> {
      return find(_class, query).then(result => result.length > 0 ? result[0] : undefined)
    },

    async tx (tx: Tx): Promise<void> {
      return txProcessor.process(tx).then(() => {

        let usersToUpdateSpaceCaches: string[] = []

        // TODO: think where to do it better: in SpaceIndex?
        // if new space created, update here userSpaces[] array
        if (tx._class === CORE_CLASS_CREATETX && memdb.is((tx as CreateTx).object._class, CORE_CLASS_SPACE)) {
          //userSpaces.push((tx as CreateTx).object._id as Ref<Space>)
          usersToUpdateSpaceCaches.push(account)
        } else if (tx._class === CORE_CLASS_UPDATETX && memdb.is((tx as UpdateTx)._objectClass, CORE_CLASS_SPACE) && 'users' in (tx as UpdateTx)._attributes) {
          const touchedSpaceId: Ref<Space> = (tx as UpdateTx)._objectId as Ref<Space>
          usersToUpdateSpaceCaches = (tx as UpdateTx)._attributes.users
        }

        // если у нас UpdateTx на спейс, где мы обновили юзера(????), надо забродкастить обновление локальных кэшей userSpaces...

        server.broadcast(clientControl, tx._space as unknown as Ref<Space>, usersToUpdateSpaceCaches, { result: tx })
      })
    },

    async loadDomain (domain: string): Promise<Doc[]> {
      if (domain === MODEL_DOMAIN)
        return memdb.dump()

      console.log('domain:', domain)
      const filteringSpaces = /*await*/ getUserSpaces()

      return db.collection(domain).find({ _space: { $in: filteringSpaces }}).toArray()
    },

    // P R O T C O L  E X T E N S I O N S

    delete (_class: Ref<Class<Doc>>, query: AnyLayout): Promise<void> {
      console.log('DELETE', _class, query)
      const domain = memdb.getDomain(_class)
      return db.collection(domain).deleteMany({ ...query }).then(result => { })
    },

    async commit (commitInfo: CommitInfo): Promise<void> {
      // group by domain
      const byDomain = commitInfo.created.reduce((group: Map<string, Doc[]>, doc) => {
        const domain = memdb.getDomain(doc._class)
        let g = group.get(domain)
        if (!g) { group.set(domain, g = []) }
        g.push(doc)
        return group
      }, new Map())

      await Promise.all(Array.from(byDomain.entries()).map(domain => db.collection(domain[0]).insertMany(domain[1])))

      // TODO: get space (from docs in commitInfo?)
      server.broadcast(clientControl, undefined as unknown as Ref<Space>, [], { result: commitInfo })
    },

    // C O N T R O L

    async ping (): Promise<any> { return null },

    send<R> (response: Response<R>): void {
      ws.send(makeResponse(response))
    },

    // TODO rename to `close`
    shutdown (): Promise<void> {
      return client.close()
    },

    serverShutdown (password: string): Promise<void> {
      return server.shutdown(password)
    },

    account () : string {
      return account
    },

    getUserSpaces,

    addSpace(space: Ref<Space>): void {
      if (userSpaces.indexOf(space) < 0) {
        userSpaces.push(space)
      }
    }
  }

  return clientControl
}
