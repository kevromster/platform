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

import { extendIds } from '@anticrm/platform-model'
import contact, { Contact, Person, User } from '@anticrm/contact'
import { Ref, Mixin, Class, Space } from '@anticrm/platform'
import { ClassUI } from '@anticrm/presentation-core'

export default extendIds(contact, {
  application: {
  },
  class: {
    Contact: '' as Ref<ClassUI<Contact>>,
    Person: '' as Ref<ClassUI<Person>>
  },
  // mixin: {
  //   User: '' as Ref<Mixin<User>>
  // }
  space: {
    Contact: '' as Ref<Space>
  }
})
