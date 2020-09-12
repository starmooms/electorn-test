<template>
  <div class="set-channel">
    <el-dialog
      title="提示"
      :visible.sync="showStart"
      width="30%"
      :before-close="handleClose"
    >
      <span>选择开始工步</span>
      <span slot="footer" class="dialog-footer">
        <el-button @click="dialogVisible = false">取 消</el-button>
        <el-button type="primary" @click="dialogVisible = false">
          确 定
        </el-button>
      </span>
    </el-dialog>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator'

@Component({
  name: 'SetChannelStatus'
})
export default class SetChannelStatus extends Vue {
  @Prop({ type: String, required: false }) iconClass!: string
  @Prop({ type: String }) className!: string
}
</script>

<style scoped>
.svg-icon {
  width: 1em;
  height: 1em;
  vertical-align: -0.15em;
  fill: currentColor;
  overflow: hidden;
}

.svg-external-icon {
  background-color: currentColor;
  mask-size: cover !important;
  display: inline-block;
}
</style>
