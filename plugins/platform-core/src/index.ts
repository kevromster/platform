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

import { plugin, Plugin, Service, Metadata } from '@anticrm/platform'
import {
  Ref, Class, Doc, AnyLayout, Obj,
  CreateTx, PushTx, UpdateTx, DeleteTx, Space, Title, CORE_CLASS_BACKLINKS, VDoc
} from '@anticrm/core'

import type { ModelDb } from './modeldb'

export type Subscriber<T> = (value: T[]) => void
export type Unsubscriber = () => void

export interface QueryResult<T extends Doc> {
  subscribe (run: Subscriber<T>): Unsubscriber
}

export interface CoreService extends Service {
  getModel (): ModelDb
  find<T extends Doc> (_class: Ref<Class<T>>, query: AnyLayout): Promise<T[]>
  findOne<T extends Doc> (_class: Ref<Class<T>>, query: AnyLayout): Promise<T | undefined>
  query<T extends Doc> (_class: Ref<Class<T>>, query: AnyLayout): QueryResult<T>
  createVDoc<T extends VDoc> (vdoc: T): Promise<void>
  createSpace(name: string): Promise<void>
  generateId (): Ref<Doc>
}

export default plugin('core' as Plugin<CoreService>, {}, {
  metadata: {
    Model: '' as Metadata<{ [key: string]: Doc[] }>,
    Offline: '' as Metadata<boolean>,
    WSHost: '' as Metadata<string>,
    WSPort: '' as Metadata<string>,
    Token: '' as Metadata<string>
  },
  class: {
    Class: '' as Ref<Class<Class<Obj>>>,
    CreateTx: '' as Ref<Class<CreateTx>>,
    PushTx: '' as Ref<Class<PushTx>>,
    UpdateTx: '' as Ref<Class<UpdateTx>>,
    DeleteTx: '' as Ref<Class<DeleteTx>>,
    Space: '' as Ref<Class<Space>>,
    Title: '' as Ref<Class<Title>>,
    Backlinks: CORE_CLASS_BACKLINKS,
    VDoc: '' as Ref<Class<VDoc>>,
  }
})
