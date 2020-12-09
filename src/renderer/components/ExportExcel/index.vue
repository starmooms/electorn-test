<template>
  <div style="display: none;">
    <file-select
      ref="fileSelect"
      :isSave="true"
      :fileFilter="fileFilter"
      @saveFile="exprotFile"
    >
      <!-- <el-button type="primary">
        导出Excel
      </el-button> -->
    </file-select>
  </div>
</template>
<script lang="ts">
import { Vue, Component } from 'vue-property-decorator'
import FileSelect from '@/renderer/components/FileSelect.vue'
import Exceljs from 'exceljs/lib/exceljs.nodejs.js'

// declare module 'exceljs/dist/es5' {
//   import ExcelJS from 'exceljs'
//   export default ExcelJS
// }

type ExportDataCb = () => {
  row: Exceljs.Column[]
  columns: Exceljs.Column[]
}

@Component({
  components: {
    FileSelect
  }
})
export default class ExportExcel extends Vue {
  $refs!: {
    fileSelect: FileSelect
  }

  fileFilter = [{ name: 'csv', extensions: ['csv'] }]
  exportDatacb!: any

  exportHandle(cb: any) {
    this.exportDatacb = cb
    this.$refs.fileSelect.action()
  }

  async exprotFile(filePath: string) {
    try {
      const workbook = new Exceljs.Workbook()
      const sheet = workbook.addWorksheet('blort')
      console.log(workbook.csv)

      const { columns, rows } = this.exportDatacb()
      sheet.columns = columns
      sheet.addRows(rows)
      await workbook.csv.writeFile(filePath, {
        formatterOptions: {
          writeBOM: true
        }
        // map(value, index) {
        //   switch (index) {
        //     case 0:
        //       // column 1 is string
        //       return value
        //     case 1:
        //       // column 2 is a date
        //       return '3333'
        //     case 2:
        //       // column 3 is a formula, write just the result
        //       return value.result
        //     default:
        //       // the rest are numbers
        //       return value
        //   }
        // },
        // https://c2fo.io/fast-csv/docs/formatting/options
        // formatterOptions: {
        //   delimiter: '\t',
        //   quote: false
        // }
      })
      this.$message.success(`已导出到 ${filePath}`)
    } catch (err) {
      console.error(err)
      this.$message.error(err.message)
    }

    // await workbook.csv.writeFile(filePath, options)
  }
}
</script>
<style lang="scss" scoped></style>
