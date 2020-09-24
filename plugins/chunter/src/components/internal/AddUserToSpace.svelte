<!--
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
-->

<script lang="ts">
  import { Ref, Space, StringProperty } from '@anticrm/core'
  import contact, { User } from '@anticrm/contact'
  import { getCoreService, getUIService } from '../../utils'

  export let space: Ref<Space>
  let username: string

  const coreService = getCoreService()
  const uiService = getUIService()

  function addUserToSpace () {
    console.log(`addUserToSpace: username = '${username}', space = '${space}'`)
    uiService.closeModal()

    coreService.then(coreService => coreService.addUserToSpace(username, space)).then(r => console.log('AddUserToSpace FINAL result:', r))
  }
</script>

<h1>Добавить пользователя<br/>в пространство</h1>
<!-- TODO: input control with autocompletion by users -->
<input type="text" class="editbox" bind:value={ username }/>
<button class="button" on:click={addUserToSpace}>Add</button>
