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
import Icon from '@anticrm/platform-ui/src/components/Icon.vue'

import workbench from '../..'
import { WorkbenchCreateItem } from '..'

import ui from '@anticrm/platform-ui'
import presentationCore from '@anticrm/presentation-core'
import { Class, Ref, VDoc } from '@anticrm/platform'
import { getCoreService } from '../utils'
import ScrollView from '@anticrm/sparkling-controls/src/ScrollView.vue'

export interface CompletionItem {
  key: string
  label: string
  title?: string
}

export default defineComponent({
  components: { Icon, ScrollView },
  props: {
    selection: String,
    items: Array as PropType<Array<CompletionItem>>,
    pos: Object as PropType<{ left: number; right: number; top: number; bottom: number }>
  },
  setup(props, context) {
    function selectItem(item: string) {
      context.emit('select', item)
    }

    let popupStyle = computed(() => {
      return `left: ${props.pos.left + 5}px; top: ${props.pos.top - 80}px;`
    })


    return {
      selectItem,
      popupStyle
    }
  }
})

</script>

<template>
  <div class="workbench-completion-popup" :style="popupStyle">
    <ScrollView style="height:100%;width: 100%;">
      <div
        v-for="item in items"
        class="item"
        :key="item.key"
        :class="{'selected': item.key == selection }"
        @click.prevent="selectItem(item.key)"
      >{{ item.title ?? item.label }}</div>
    </ScrollView>
  </div>
</template>

<style lang="scss">
@import "~@anticrm/sparkling-theme/css/_variables.scss";

.workbench-completion-popup {
  display: flex;
  flex-direction: column;
  background-color: $input-color;
  color: #fff;
  position: absolute;
  border: 1px solid $content-color-dark;
  border-radius: 3px;
  height: 75px;
  width: 300px;

  .item {
    font-size: 14px;
    font-family: Raleway;
    white-space: no-wrap;
    width: 100%;

    &.selected {
      border-color: $highlight-color;
      background-color: darken($highlight-color, 30%);
      position: sticky;
    }

    &:focus {
      outline: none;
      border-color: $highlight-color;
      box-shadow: inset 0px 0px 2px 0px $highlight-color;
    }

    &:hover {
      border-color: $highlight-color;
      background-color: darken($highlight-color, 20%);
    }
  }
}
</style>
