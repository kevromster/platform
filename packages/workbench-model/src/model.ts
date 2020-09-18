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

import core, { Builder } from '@anticrm/platform-model'
import workbench from '.'
import chunter from '@anticrm/chunter-model'
import contact from '@anticrm/contact-model'
import presentation from '@anticrm/presentation-core'

import { StringProperty, CoreDomain, Metadata, Ref, Class, VDoc } from '@anticrm/platform'
import { IntlString } from '@anticrm/platform-i18n'

export default (S: Builder) => {
  S.createClass(workbench.class.Application, core.class.Doc, {
    label: S.attr(core.class.String, {}),
    icon: S.attr(core.class.Type, {}),
    // appClass: S.attr(core.class.Type, {}),
    component: S.attr(core.class.Type, {})
  }, CoreDomain.Model)

  S.createClass(workbench.class.WorkbenchCreateItem, core.class.Doc, {
    label: S.attr(core.class.String, {}),
    icon: S.attr(core.class.Type, {}),
    itemClass: S.attr(core.class.Type, {})
  }, CoreDomain.Model)

  S.createDocument(workbench.class.Application, {
    label: 'Default' as StringProperty,
    icon: chunter.icon.Chunter,
    component: workbench.component.Browser
    // appClass: chunter.class.Message
  }, workbench.application.Default)

  console.log('!!! create workbench-model !!!')

  S.createDocument(core.class.Space, {
    title: 'Контакты' as IntlString
  }, contact.space.Contact)

  S.createMixin(workbench.mixin.SpaceExtension, core.class.Space, {
    component: S.attr(core.class.Type, {})
  })

  S.mixin(contact.space.Contact, workbench.mixin.SpaceExtension, {
    component: chunter.component.ChunterView
  })

  S.createDocument(workbench.class.WorkbenchCreateItem, {
    label: 'Пространства / Новое пространство' as StringProperty,
    icon: undefined as unknown as Metadata<string>,
    itemClass: core.class.Space as unknown as Ref<Class<VDoc>>  // TODO: bad cast?
  })

  S.mixin(core.class.Space, presentation.class.DetailForm, {
    component: workbench.component.NewSpace
  })
}
