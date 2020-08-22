<template>
  <div>
    <template v-if="form">
      <el-form ref="form" :model="form" label-width="25%">
        <el-form-item v-for="item in list" :key="item.type" :label="item.name">
          <el-input-number
            class="small-input"
            v-model="form[item.type]"
            controls-position="right"
          ></el-input-number>
        </el-form-item>
      </el-form>
      <FromAction
        ref="FromAction"
        title="保护设置"
        :data.sync="form"
        @submit="submit"
      ></FromAction>
    </template>
  </div>
</template>
<script lang="ts">
import { Vue, Component } from 'vue-property-decorator'
import FromAction from './FromAction.vue'
import { PROTECT } from '@/shared/config/master'
import { deepClone } from '@/shared/utils'
import { setProtect } from '@/renderer/ipc/master'

@Component({
  components: {
    FromAction
  }
})
export default class Protect extends Vue {
  $refs!: {
    FromAction: FromAction
  }

  form = {
    UCi: 0,
    ICi: 0,
    IDisCi: 0,
    UMax: 0,
    UMin: 0,
    TimeMin: 0,
    warnVal: 0
  }

  list = deepClone(PROTECT)

  async submit() {
    await setProtect({
      form: this.form
    })
  }

  mounted() {
    this.$nextTick(() => {
      this.$refs.FromAction.update()
    })
  }
}
</script>
