<template>
  <div>
    <el-dialog
      title="机柜查看"
      width="800px"
      :visible.sync="dialog"
      :close-on-click-modal="false"
    >
      <div v-if="masterInfo">
        <el-table
          border
          class="min-el-tabel border-el-table"
          height="300px"
          :data="masterInfo.slaverList"
        >
          <!-- eslint-disable -->
          <el-table-column label="从控号" width="80">
            <template v-slot="{ row }">
              {{ `${row.slaverId + 1}` }}
            </template>
          </el-table-column>
          <el-table-column prop="version" label="版本号"></el-table-column>
          <el-table-column prop="machineId" label="机身号"></el-table-column>
          <!-- eslint-enabel -->
        </el-table>
      </div>
    </el-dialog>
  </div>
</template>

<script lang="ts">
import { Component, Vue, PropSync, Prop } from 'vue-property-decorator'

@Component
export default class DetailsInfo extends Vue {
  @PropSync('show', { type: Boolean, default: false })
  private dialog!: boolean

  @Prop({ type: Object, required: false }) masterInfo!: IpConfigT.MasterInfo
}
</script>
