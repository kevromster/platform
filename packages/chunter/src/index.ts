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

import { DateProperty, Emb, plugin, Plugin, Service, StringProperty, VDoc, Ref, Mixin } from '@anticrm/platform'
import { AnyComponent, Asset } from '@anticrm/platform-ui'
import contact from '@anticrm/contact'
import ui from '@anticrm/platform-ui'
import { ComponentExtension, ClassUI } from '@anticrm/presentation-core'

export interface Comment extends Emb {
  _createdOn: DateProperty
  _createdBy: StringProperty
  _modifiedOn?: DateProperty
  message: string
}

export interface Message extends VDoc {
  message: string
  comments: Comment[]
}

export default plugin('chunter' as Plugin<Service>, { ui: ui.id, contact: contact.id }, {
  icon: {
    Chunter: '' as Asset,
  },
  component: {
    ChunterView: '' as AnyComponent,
    ContactInfo: '' as AnyComponent,
    MessageInfo: '' as AnyComponent,
  },
  mixin: {
    ChunterInfo: '' as Ref<Mixin<ComponentExtension<VDoc>>>,
  },
  class: {
    Message: '' as Ref<ClassUI<Message>>
  }

})
