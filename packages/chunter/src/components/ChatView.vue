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

import { defineComponent, ref, watch, watchEffect, onUnmounted } from 'vue'
import { Doc, Ref, Space } from '@anticrm/platform'
import { UIService, getUIService } from '@anticrm/platform-ui'

import Table from '@anticrm/presentation-ui/src/components/Table.vue'
import Icon from '@anticrm/platform-ui/src/components/Icon.vue'
import ScrollView from '@anticrm/sparkling-controls/src/ScrollView.vue'
import ChunterItem from './ChunterItem.vue'

import core from '@anticrm/platform-core'
import chunter from '@anticrm/chunter'

import { getCoreService } from '../utils'

export default defineComponent({
  components: {
    ScrollView,
    Table,
    Icon,
    ChunterItem,
  },
  props: {
    activespace: String
  },
  setup (props, context) {
    const coreService = getCoreService()
    const uiService = getUIService()

    const content = ref([] as Doc[])

    const shutdown = coreService.query(core.class.CreateTx, { _objectClass: chunter.class.Message }, (result: Doc[]) => {
      const actualActiveSpace = uiService.getLocation().path[1] as Ref<Space>
      console.log('ChatView.vue: fill result to show (from cached query):', result, 'actualActiveSpace: \'', actualActiveSpace, '\'')

      if (actualActiveSpace) {
        const filteredRes: Doc[] = []
        for (const doc of result) {
          if (doc['_space'] === actualActiveSpace) {
            filteredRes.push(doc)
          }
        }
        content.value = filteredRes
      } else {
        content.value = result
      }
    })

    // const q = props.space ? { space: props.space } as unknown as AnyLayout : {}
    onUnmounted(() => shutdown())

    function navigatex(project: Ref<Doc>) {
      console.log('!!!ChatView.vue navigateX()!!!', project)
    }
    function onNavigatex(project: Ref<Doc>) {
      console.log('!!!ChatView.vue onNavigateX()!!!', project)
    }

    watchEffect(() => {
      console.log('ChatView.vue watchEffect')
    })

    watch(() => props.activespace, (newValue, oldValue) => {
      console.log('ChatView.vue: watch!!! newValue `', newValue, '`, oldValue `', oldValue, '`, current props.activespace `', props.activespace, '`')
      const query = { _objectClass: chunter.class.Message }
      const activeSpace = newValue
      if (activeSpace) {
        query['_space'] = activeSpace
      }
      coreService.find(core.class.CreateTx, query)
        .then(result => {
          console.log('ChatView.vue: fill result to show (from update on space change): ', result)
          content.value = result
        })
    })

    return { open, content, navigatex, onNavigatex }
  }
})
</script>

<template>
  <div class="chat-view">
    <div>
      <span class="caption-1">Chat</span>&nbsp;
    </div>
    <ScrollView>
      <div class="content">
        <ChunterItem :tx="doc" v-for="doc in content" :key="doc._id" :showId=false @open="$emit('open', $event)" />
      </div>
    </ScrollView>
  </div>
</template>

<style lang="scss">
.chat-view {
  height: 100%;
  display: flex;
  flex-direction: column;

  .sparkling-scroll-view {
    height: 100%;
  }

  .content {
    flex-grow: 1;
  }
}
</style>
