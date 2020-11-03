<template>
  <div class="setting-container">
    <h4 class="title">设置</h4>
    <el-tabs v-model="activeName">
      <el-tab-pane
        v-for="item in tabList"
        :key="item.name"
        :label="item.label"
        :name="item.name"
      ></el-tab-pane>
    </el-tabs>
    <div class="setting-box">
      <keep-alive>
        <component :is="activeName"></component>
      </keep-alive>
    </div>
  </div>
</template>
<script lang="ts">
import { Vue, Component } from 'vue-property-decorator'
import Base from './components/Base.vue'

@Component({
  components: {
    Base
  }
})
export default class Setting extends Vue {
  tabList = [
    {
      label: '基础设置',
      name: 'Base'
    }
    // {
    //   label: '保护参数设置',
    //   name: 'Protect'
    // },
    // {
    //   label: '采样设置',
    //   name: 'Sampling'
    // }
  ]
  activeName = this.tabList[0].name
}
</script>

<style lang="scss" scoped>
.setting-container {
  margin-top: 0;
}
.setting-box {
  padding: 16px 7% 64px 0;
  ::v-deep {
    .small-input {
      max-width: 120px;
    }
    .from-sub-item {
      color: $--color-text-regular;
      margin-bottom: 10px;
      &:last-of-type {
        margin-bottom: 0;
      }
      .from-sub-name {
        margin-right: 10px;
      }
    }
  }
}
</style>
