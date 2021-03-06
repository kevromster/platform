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
import { defineComponent, ref } from 'vue'
import Icon from '@anticrm/platform-ui/src/components/Icon.vue'
import CreateForm from './CreateForm.vue'
import CreateMenu from './CreateMenu.vue'
import workbench, { WorkbenchCreateItem } from '..'
import ui from '@anticrm/platform-ui'
import presentationCore from '@anticrm/presentation-core'
import { Class, Ref, VDoc } from '@anticrm/platform'
import { getCoreService, getPresentationCore } from '../utils'

import Toolbar from '@anticrm/sparkling-controls/src/toolbar/Toolbar.vue'
import ToolbarButton from '@anticrm/sparkling-controls/src/toolbar/Button.vue'

import EditorContent from '@anticrm/sparkling-rich/src/EditorContent.vue'
import { EditorContentEvent } from '@anticrm/sparkling-rich/src/index'

import contact, { User, Contact } from '@anticrm/contact/src/index'

import CompletionPopup, { CompletionItem } from './CompletionPopup.vue'

function startsWith (str: string | undefined, prefix: string) {
  return (str ?? '').startsWith(prefix)
}

export default defineComponent({
  components: { Icon, CreateForm, CreateMenu, EditorContent, Toolbar, ToolbarButton, CompletionPopup },
  props: {
  },
  setup (props, context) {
    const coreService = getCoreService()
    const model = coreService.getModel()

    const presentationCoreService = getPresentationCore()

    const showMenu = ref(false)
    const component = ref('')
    const createItem = ref<WorkbenchCreateItem | null>(null)

    let htmlValue = ref('')
    let styleState = ref({ isEmpty: true, cursor: { left: 0, top: 0, bottom: 0, right: 0 } } as EditorContentEvent)
    const htmlEditor = ref(null)
    let stylesEnabled = ref(false)
    let completions = ref({ selection: null as CompletionItem, items: [] as CompletionItem[] })

    function add () {
      showMenu.value = !showMenu.value
    }

    function selectItem (item: WorkbenchCreateItem) {
      showMenu.value = false
      createItem.value = item
      component.value = presentationCoreService.getComponentExtension(item.itemClass, presentationCore.class.DetailForm)
    }

    function done () {
      component.value = ''
    }
    function updateStyle (event: EditorContentEvent) {
      styleState.value = event

      if (event.completionWord.length == 0) {
        completions.value = {
          selection: null as CompletionItem, items: []
        }
        return
      }

      if (event.completionWord.startsWith("@")) {
        const userPrefix = event.completionWord.substring(1)
        coreService.find(contact.mixin.User, {}).then(docs => {
          let items: CompletionItem[] = []
          const all = docs as User[]
          for (const value of all) {
            if (startsWith(value.account, userPrefix)) {
              let kk = "@" + value.account
              items.push({ key: kk, label: kk, title: kk + " - " + value.firstName + ' ' + value.lastName } as CompletionItem)
            }
          }
          completions.value = {
            selection: (items.length > 0 ? items[0] : null), items: items
          }
        })
      } else {
        // Calc some completions here.
        let operations: CompletionItem[] = [
          { key: "#1", label: "create task", title: "Perform a task creation" },
          { key: "#1.2", label: "create contact" },
          { key: "#2", label: "delete task" },
          { key: "#2.2", label: "delete contact" },
          { key: "#3", label: "search" },
          { key: "#3.1", label: "search task" },
          { key: "#3.2", label: "search contact" },
          { key: "#4", label: "stop task" },
        ]
        let items = operations.filter((e) => e.label.startsWith(event.completionWord) && e.label !== event.completionWord)
        completions.value = {
          selection: (items.length > 0 ? items[0] : null), items: items
        }
      }
    }
    function handlePopupSelected (value) {
      htmlEditor.value.insert(value.substring(styleState.value.completionWord.length) + " ", styleState.value.selection.from, styleState.value.selection.to)
      htmlEditor.value.focus()
    }
    function onKeyDown (event) {
      if (completions.value.items.length > 0 && completions.value.selection != null) {
        if (event.key === "ArrowUp") {
          let pos = completions.value.items.indexOf(completions.value.selection)
          if (pos > 0) {
            completions.value.selection = completions.value.items[pos - 1]
          }
          event.preventDefault()
          return
        }
        if (event.key === "ArrowDown") {
          let pos = completions.value.items.indexOf(completions.value.selection)
          if (pos < completions.value.items.length - 1) {
            completions.value.selection = completions.value.items[pos + 1]
          }
          event.preventDefault()
          return
        }
        if (event.key === "Enter") {
          handlePopupSelected(completions.value.selection.label)
          event.preventDefault()
          return
        }
        if (event.key === "Escape") {
          completions.value = { selection: null as CompletionItem, items: [] }
          return
        }
      }
      if (event.key === "Enter") {
        context.emit('message', htmlValue.value)
        htmlValue.value = ''
        event.preventDefault()
      }
    }


    return {
      showMenu,
      component,
      createItem,
      selectItem,
      add,
      done,
      workbench,
      htmlValue,
      htmlEditor,
      styleState,
      stylesEnabled,
      updateStyle,
      completions,
      onKeyDown,
      handlePopupSelected
    }
  }
})

</script>

<template>
  <div class="workbench-input-control">
    <CreateForm
      v-if="component !== ''"
      :component="component"
      :_class="createItem.itemClass"
      :title="createItem.label"
      @done="done"
    />
    <div>
      <div :class="{'flex-column':stylesEnabled, 'flex-row': !stylesEnabled}">
        <Toolbar v-if="!stylesEnabled" class="style-buttons">
          <CreateMenu :visible="showMenu" @select="selectItem" />
          <a href="#" @click.prevent="add">
            <Icon :icon="workbench.icon.Add" class="icon-embed-2x" />
          </a>
        </Toolbar>

        <editor-content
          ref="htmlEditor"
          :class="{'edit-box-vertical':stylesEnabled, 'edit-box-horizontal': !stylesEnabled}"
          :content="htmlValue"
          triggers="@#"
          @update:content="htmlValue = $event"
          @styleEvent="updateStyle"
          @keyDown="onKeyDown"
        />
        <completion-popup
          ref="popupControl"
          v-if="completions.items.length > 0 "
          :selection="completions.selection.key || ''"
          :items="completions.items"
          :pos="styleState.cursor"
          @select="handlePopupSelected"
        />

        <div v-if="stylesEnabled" class="separator" />
        <Toolbar>
          <template v-if="stylesEnabled">
            <a href="#" @click.prevent="add">
              <Icon :icon="workbench.icon.Add" class="icon-embed-2x" />
            </a>
            <ToolbarButton
              class="small"
              @click="htmlEditor.toggleBold()"
              style="font-weight:bold;"
              :selected="styleState.bold"
            >B</ToolbarButton>
            <ToolbarButton
              class="small"
              @click="htmlEditor.toggleItalic()"
              style="font-weight:italic;"
              :selected="styleState.italic"
            >I</ToolbarButton>
            <ToolbarButton
              class="small"
              v-on:click="htmlEditor.toggleUnderline()"
              style="font-weight:underline;"
              :selected="styleState.underline"
            >U</ToolbarButton>
            <ToolbarButton
              class="small"
              v-on:click="htmlEditor.toggleStrike()"
              :selected="styleState.strike"
            >~</ToolbarButton>
            <ToolbarButton class="small" v-on:click="htmlEditor.toggleUnOrderedList()">L</ToolbarButton>
            <ToolbarButton class="small" v-on:click="htmlEditor.toggleOrderedList()">O</ToolbarButton>
          </template>
          <template v-slot:right>
            <ToolbarButton class="small" @click="handleSubmit()" :selected="!styleState.isEmpty">▶️</ToolbarButton>
            <ToolbarButton class="small">😀</ToolbarButton>
            <ToolbarButton class="small" @click="stylesEnabled = !stylesEnabled">Aa</ToolbarButton>
          </template>
        </Toolbar>
      </div>
    </div>
  </div>
</template>

<style lang="scss">
@import "~@anticrm/sparkling-theme/css/_variables.scss";

.workbench-input-control {
  width: 100%;

  background-color: $input-color;
  border: 1px solid $content-color-dark;
  border-radius: 4px;
  padding: 1em;
  box-sizing: border-box;

  .flex-column {
    display: flex;
    flex-direction: column;
    align-items: stretch;
  }
  .flex-row {
    display: flex;
    flex-direction: row;
    align-items: flex-end;
  }

  .edit-box-horizontal {
    width: 100%;
    height: 100%;
    align-self: center;
  }
  .edit-box-vertical {
    width: 100%;
    height: 100%;
    margin: 5px;
  }
}
</style>
