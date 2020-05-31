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

import { Property, plugin, Plugin, Service } from '@anticrm/platform'
import { Doc, Ref, Class, StringType } from '@anticrm/platform-core'
import { Asset, ComponentRef, AnyComponent } from '@anticrm/platform-ui'

export type DateType = number & Property<Date>

export interface Contact extends Doc {
  email?: StringType
  phone?: StringType
}

export interface Person extends Contact {
  firstName?: StringType
  lastName?: StringType

  birthDate?: DateType
}

export default plugin(
  'contact' as Plugin<Service>,
  {},
  {
    icon: {
      Date: '' as Asset,
      Email: '' as Asset,
      Phone: '' as Asset,
      Address: '' as Asset,
    },
    class: {
      Contact: '' as Ref<Class<Contact>>,
      Person: '' as Ref<Class<Person>>
    },
    form: {
      Person: '' as AnyComponent
    }
  })