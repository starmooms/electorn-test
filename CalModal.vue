<template>
  <el-dialog title="校准" :close-on-click-modal="false" :visible.sync="dialog">
    <!-- <el-button type="text" @click="stepsAdd">添加工步</el-button>

    <el-table :data="stepsList" height="40vh">
      <el-table-column type="index" label="步次" width="50"></el-table-column>
      <el-table-column label="工步类型" width="150">
        <template slot-scope="{ row, $index }">
          <el-select
            v-model="row.setId"
            placeholder="请选择"
            @change="stepItemIdChange($event, row, $index)"
          >
            <el-option
              v-for="item in stepsSelectList"
              :key="item.value"
              :label="item.label"
              :value="item.value"
              :disabled="item.value === 'loop' && hasLoop"
            ></el-option>
          </el-select>
        </template>
      </el-table-column>
      <el-table-column label="设置" min-width="400">
        <template
          slot-scope="{ row }"
          v-if="row.setId && stepsSelectMap[row.setId]"
        >
          <div class="input-box">
            <div
              v-for="inputType in stepsSelectMap[row.setId].input"
              :key="inputType"
              class="input-item"
            >
              {{ stepsInputMap[inputType].name }}：
              <el-input type="text" v-model.number="row[inputType]" />
            </div>
          </div>
        </template>
      </el-table-column>
      <el-table-column width="100" label="操作">
        <template slot-scope="{ $index }">
          <el-button type="text" @click="stepsDel($index)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <div slot="footer">
      <el-button @click="stepsDialog = false">取 消</el-button>
      <el-button type="primary" @click="stepsSave">
        确 定
      </el-button>
    </div> -->
    
  </el-dialog>
</template>

<script lang="ts">
import { Component, Vue, PropSync, Prop, Watch } from 'vue-property-decorator'
import { Port } from '@/types/Port'
import { setSteps } from '@/renderer/ipc/channel'

@Component
export default class StepSetModal extends Vue {
  @PropSync('show', { type: Boolean, default: false })
  private dialog!: boolean

  @Prop({ type: Object }) private showItem!: any | null

  list: Port.Item[] = []

  // @Watch('dialog')
  // dialogChange(v) {
  //   if (v === true) {

  //   }
  // }

  mounted() {
    this.getStepsList()
  }
}
</script>

<style lang="scss"></style>
