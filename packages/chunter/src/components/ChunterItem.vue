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

import { defineComponent, ref, PropType, computed } from 'vue'
import { CreateTx } from '@anticrm/platform'

import { getPresentationCore } from '../utils'
import { User, getContactService } from '@anticrm/contact'
import chunter from '..'

export default defineComponent({
  components: {
  },
  props: {
    tx: Object as PropType<CreateTx>,
    showId: Boolean
  },
  setup (props, context) {
    const contactService = getContactService()
    const presentationCore = getPresentationCore()

    const user = ref<User | undefined>(undefined)

    contactService.getUser(props.tx._user).then(u => user.value = u)

    const component = presentationCore.getComponentExtension(props.tx._objectClass, chunter.mixin.ChunterInfo)
    const messageTime = computed(() => new Date(props.tx._date).toLocaleString())

    return { user, component, messageTime }
  }
})
</script>

<template>
  <div class="chunter-chunter-item">
    <img class="avatar" src="../../assets/ava2x48.jpg" />
    <div class="details">
      <div v-if="showId">
        <b>{{user?.name}} {{ user?._id }}</b> {{ messageTime }}
      </div>
      <div v-else>
        <b>{{user?.name}}</b> {{ messageTime }}
      </div>
      <div>
        <widget :component="component" :tx="tx" @open="$emit('open', $event)" />
      </div>
    </div>
  </div>
</template>

<style lang="scss">
.chunter-chunter-item {
  display: flex;
  margin: 1em;

  .avatar {
    object-fit: cover;
    border-radius: 4px;
    width: 3em;
    height: 3em;
  }

  .details {
    padding-left: 1em;
  }
}
</style>