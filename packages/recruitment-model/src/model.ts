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

import core, { Builder, ModelClass, Prop } from '@anticrm/platform-model'
import { UX } from '@anticrm/presentation-model'

import workbench from '@anticrm/workbench-model'
import { StringProperty } from '@anticrm/platform'
import contact from '@anticrm/contact-model'
import presentation from '@anticrm/presentation-core'

import recruitment from '.'
import { IntlString } from '@anticrm/platform-i18n'
import { Candidate } from '@anticrm/recruitment/src'

import { TPerson } from '@anticrm/contact-model/src/model'

@ModelClass(recruitment.class.Candidate, contact.class.Person)
@UX('Контактная информация' as IntlString)
class TCandidate extends TPerson implements Candidate {
  @Prop() @UX('Текущая должность' as IntlString, recruitment.icon.Position) currentPosition!: string
  @Prop() @UX('Место работы' as IntlString, recruitment.icon.Employer) currentEmployer!: string
}

export default (S: Builder) => {
  S.add(TCandidate)

  console.log('!!! recruitment-model create model !!!')

  // S.createDocument(workbench.class.Application, {
  //   label: 'Найм' as StringProperty,
  //   icon: recruitment.icon.Recruitment,
  //   main: presentationUI.component.BrowseView,
  //   appClass: recruitment.class.Candidate
  // }, recruitment.application.Recruitment)

  // S.mixin(recruitment.class.Candidate as Ref<Class<Candidate>>, presentation.class.DetailsForm, {
  //   form: recruitment.component.View2
  // })

  S.createDocument(workbench.class.WorkbenchCreateItem, {
    label: 'Кандидаты' as StringProperty,
    createNewItemLabel: 'Новый кандидат' as StringProperty,
    icon: recruitment.icon.Recruitment,
    itemClass: recruitment.class.Candidate
  })

  S.createDocument(core.class.Space, {
    title: 'Рекрутинг' as IntlString
  }, recruitment.space.Recruitment)
}
