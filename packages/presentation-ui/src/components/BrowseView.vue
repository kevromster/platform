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

import { defineComponent, onUnmounted, PropType, ref, watch } from 'vue'
import workbench from '@anticrm/workbench/src'
import { AnyLayout } from '@anticrm/platform'

import Table from '@anticrm/presentation-ui/src/components/Table.vue'
import Icon from '@anticrm/platform-ui/src/components/Icon.vue'
import ScrollView from '@anticrm/sparkling-controls/src/ScrollView.vue'

import { getCoreService } from '@anticrm/workbench/src/utils'
import { Class, Doc, Ref, VDoc } from '@anticrm/platform'

export default defineComponent({
  components: {
    ScrollView,
    Table,
    Icon,
  },
  props: {
    _class: {
      type: String as unknown as PropType<Ref<Class<VDoc>>>,
      required: true
    },
    space: {
      type: String
    }
  },
  setup (props, context) {
    const coreService = getCoreService()
    const model = coreService.getModel()

    const content = ref([] as Doc[])

    let shutdown: any = null

    watch(() => props._class, _class => {
      if (shutdown) { shutdown() }
      const q = props.space ? { space: props.space } as unknown as AnyLayout : {}
      shutdown = coreService.query(props._class, q, (result: Doc[]) => {
        console.log('result: ', result)
        content.value = result
      })
    }, { immediate: true })

    onUnmounted(() => shutdown())

    function open (object: Object) {
      context.emit('open', object)
    }

    return { workbench, open, content }
  }
})
</script>

<template>
  <div class="workbench-browse">
    <div>
      <span class="caption-1">{{_class}}</span>&nbsp;
      <!--      <a href="#" @click.prevent="add"><Icon :icon="workbench.icon.Add" class="icon-embed-2x"/></a>-->
    </div>
    <div class="table">
      <ScrollView style="height: 100%">
        <Table :_class="_class" :content="content" @open="open" />
      </ScrollView>
    </div>
  </div>
</template>

<style lang="scss">
.workbench-browse {
  height: 100%;
  display: flex;
  flex-direction: column;

  .table {
    flex-grow: 1;
  }
}
</style>