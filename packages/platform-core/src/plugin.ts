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

import {
  AnyLayout, Class, CoreDomain, Doc, Platform, Ref, VDoc, Tx,
  generateId, CreateTx, PropertyType, Property, Space, Title, CoreProtocol, BACKLINKS_DOMAIN
} from '@anticrm/platform'
import core, { CoreService } from '.'
import { ModelDb } from './modeldb'
import { createCache } from './indexeddb'
import rpcService from './rpc'
import login from '@anticrm/login'
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
    tx: (tx: Tx): Promise<void> => rpc.request('tx', tx).then(() => coreOffline.tx(tx)),
    loadDomain: (domain: string): Promise<Doc[]> => rpc.request('loadDomain', domain),
  }

  const model = new ModelDb()
  const titles = new Titles()
  const graph = new Graph()

  // add listener to process data updates from backend
  rpc.addEventListener(response => coreOffline.tx(response.result as Tx))

  const offline = platform.getMetadata(core.metadata.Model)
  if (offline) {
    model.loadModel(offline[CoreDomain.Model])
  } else {
    model.loadModel(await coreProtocol.loadDomain(CoreDomain.Model))
  }

  coreProtocol.loadDomain(CoreDomain.Title).then(docs => {
    for (const doc of docs) {
      titles.store(doc)
    }
  })

  coreProtocol.loadDomain(BACKLINKS_DOMAIN).then(docs => {
    for (const doc of docs) {
      graph.store(doc)
    }
  })

  const cache = await createCache('db5', model, titles, graph)

  interface Query {
    _class: Ref<Class<Doc>>
    query: AnyLayout
    instances: Doc[]
    listener: (result: Doc[]) => void
  }

  const queries = [] as Query[]

  function queryOffline (_class: Ref<Class<Doc>>, query: AnyLayout, listener: (result: Doc[]) => void): () => void {
    const q: Query = { _class, query, listener, instances: [] }
    queries.push(q)

    const done = false

    findOffline(_class as Ref<Class<Doc>>, query)
      .then(result => {
        // network call may perform faster than cache access :),
        // so we do not return cached results in this case
        if (!done) {
          q.instances = result
          listener(result)
        }
      })

    return () => {
      queries.splice(queries.indexOf(q), 1)
    }
  }

  function queryOnline (_class: Ref<Class<Doc>>, query: AnyLayout, listener: (result: Doc[]) => void): () => void {
    const q: Query = { _class, query, listener, instances: [] }
    queries.push(q)

    const done = false

    coreProtocol.find(_class as Ref<Class<Doc>>, query)
      .then(result => {
        q.instances = result
        listener(result)
      })

    // cache.find(_class as Ref<Class<Doc>>, query)
    //   .then(result => {
    //     // network call may perform faster than cache access :),
    //     // so we do not return cached results in this case
    //     if (!done) {
    //       q.instances = result
    //       listener(result)
    //     }
    //   })

    // coreProtocol.find(_class as Ref<Class<Doc>>, query) // !!!!! WRONG, need hibernate
    //   .then(async result => {
    //     done = true
    //     ; ((await cache).cache(result)).then(() => console.log('RESULTS CACHED'))
    //     return Promise.all(result.map(doc => prototypes.instantiateDoc(doc)))
    //   })
    //   .then(async result => {
    //     q.instances = result
    //     listener(result as unknown as Instance<T>[])
    //   })

    return () => {
      queries.splice(queries.indexOf(q), 1)
    }
  }

  // C O R E  P R O T O C O L  (C A C H E)

  const findOffline = (_class: Ref<Class<Doc>>, query: AnyLayout): Promise<Doc[]> => cache.find(_class, query)

  const coreOffline = {
    query: queryOffline,
    find: findOffline,
    findOne: (_class: Ref<Class<Doc>>, query: AnyLayout): Promise<Doc | undefined> => cache.findOne(_class, query),
    tx: (tx: Tx): Promise<void> => {
      const c = cache.tx(tx)
      for (const q of queries) {
        // TODO: check if given tx affect query results
        coreProtocol.find(q._class, q.query).then(result => {
          q.listener(result)
        })
      }
      return c
    },
    loadDomain: (domain: string, index?: string, direction?: string): Promise<Doc[]> => {
      if (domain === CoreDomain.Model) {
        return model.loadDomain(domain)
      } else {
        return cache.loadDomain(domain, index, direction)
      }
    }
  }

  // const findOnline = (_class: Ref<Class<Doc>>, query: AnyLayout): Promise<Doc[]> => rpc.request('find', _class, query)

  const coreRpc = {
    query: queryOnline,
    ...coreProtocol
    // find: findOnline,
    // findOne: (_class: Ref<Class<Doc>>, query: AnyLayout): Promise<Doc | undefined> => rpc.request('findOne', _class, query),
    // tx: (tx: Tx): Promise<void> => rpc.request('tx', tx).then(() => coreOffline.tx(tx)),
    // loadDomain: (domain: string): Promise<Doc[]> => rpc.request('loadDomain', domain),
  }

  //const proto = platform.getMetadata(core.metadata.Offline) ? coreOffline : coreRpc
  const proto = coreRpc

  function createVDoc<T extends VDoc> (_class: Ref<Class<T>>, _attributes: Omit<T, keyof VDoc>, _space: Ref<Space>, _id?: Ref<T>): Promise<void> {

    const objectId = _id ?? generateId() as Ref<T>

    const tx: CreateTx = {
      _space,
      _class: core.class.CreateTx,
      _id: generateId() as Ref<Doc>,

      _objectId: objectId,
      _objectClass: _class,

      _date: Date.now() as Property<number, Date>,
      _user: platform.getMetadata(login.metadata.WhoAmI) as Property<string, string>,

      _attributes: _attributes as unknown as { [key: string]: PropertyType }
    }

    return proto.tx(tx)
  }

  const service = {
    getModel () { return model },
    getTitles () { return titles },
    getGraph () { return graph },
    generateId (): Ref<Doc> { return generateId() as Ref<Doc> },
    createVDoc,
    // query,
    ...proto
  }

  return service
}
