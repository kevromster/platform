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
import { defineComponent, ref, reactive, inject, computed, PropType } from 'vue'
import core, { Ref, Doc, Class, Instance, ClassKind } from '@anticrm/platform-core'
import { getSession, getUIService, getVueService } from '@anticrm/platform-vue'

import contact, { Person } from '..'

import Table from '@anticrm/platform-vue/src/components/Table.vue'
import LinkTo from '@anticrm/platform-vue/src/components/LinkTo.vue'
import ScrollView from '@anticrm/sparkling-controls/src/ScrollView.vue'

export default defineComponent({
  components: { Table, LinkTo, ScrollView },
  props: {
    resource: String as unknown as PropType<Ref<Class<Person>>>,
    params: Object
  },
  setup (props) {
    const session = getSession()
    const uiService = getUIService()
    const vueService = getVueService()

    const model = ref([])
    const content = ref([])

    session.getInstance(core.class.Class, props.resource)
      .then(clazz => uiService.getAttrModel(clazz))
      .then(attrs => model.value = attrs)

    session.query(props.resource, {}, result => {
      console.log('CONTACT QUERY UPDATE: ')
      console.log(result)
      content.value = result.concat()
    })

    function navigate (id: Ref<Doc>) {
      console.log('NAVIGATE: ' + id)
      console.log(vueService.getLocation())
      const loc = { ...vueService.getLocation() }
      loc.path = props.resource + '/view'
      loc.params = { id }
      const url = vueService.toUrl(loc)
      console.log(url)
      vueService.navigate(url)
    }

    return { model, content, navigate }
  }
})
</script>

<template>
  <div class="contact-browse-form">
    <div>
      <div class="caption-1">Персоны</div>
      <LinkTo :path="`${resource}/new`">Новая Персона</LinkTo>
    </div>
    <ScrollView class="container">
      <Table :model="model" :content="content" @navigate="navigate" />
    </ScrollView>
  </div>
</template>

<style lang="scss">
@import "~@anticrm/sparkling-theme/css/_variables.scss";

.contact-browse-form {
  height: 100%;
  display: flex;
  flex-direction: column;

  .container {
    height: 100%;
  }
}
</style>
