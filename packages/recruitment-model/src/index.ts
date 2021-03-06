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
import recruitment from '@anticrm/recruitment'
import { Ref, Space } from '@anticrm/platform'
import { Application } from '@anticrm/workbench'
import { Candidate } from '@anticrm/recruitment/src'
import { ClassUI } from '@anticrm/presentation-core'

export enum RecruitmentDomain {
  Recruitment = 'contact'
}

export default extendIds(recruitment, {
  application: {
    Recruitment: '' as Ref<Application>
  },
  class: {
    Candidate: '' as Ref<ClassUI<Candidate>>
  },
  space: {
    Recruitment: '' as Ref<Space>
  }
})
