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

import { createApp } from 'vue'
import ErrorPage from './components/ErrorPage.vue'

import platform from '@anticrm/boot/src/platform'
import core from '@anticrm/platform-core'
import ui from '@anticrm/platform-ui'
import i18n from '@anticrm/platform-i18n'

import { Model, Strings } from '@anticrm/boot/src/boot'

platform.setMetadata(core.metadata.Offline, true)

platform.setMetadata(core.metadata.Model, Model)
platform.setMetadata(i18n.metadata.Strings, Strings)

async function boot (): Promise<void> {
  const uiService = await platform.getPlugin(ui.id)
  uiService.getApp().mount('#app')
}

boot().catch(err => {
  console.log(err)
  createApp(ErrorPage).mount('#app')
})
