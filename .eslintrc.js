// https://github.com/vuejs/eslint-plugin-vue
module.exports = {
  root: true,
  env: {
    node: true
  },
  extends: [
    'plugin:vue/essential',
    'plugin:vue/recommended',
    'eslint:recommended',
    '@vue/typescript/recommended',
    '@vue/prettier',
    '@vue/prettier/@typescript-eslint'
  ],
  parserOptions: {
    ecmaVersion: 2020
  },
  rules: {
    '@typescript-eslint/no-explicit-any': 'off',
    '@typescript-eslint/no-non-null-assertion': 'off',
    'no-console': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
    'no-debugger': process.env.NODE_ENV === 'production' ? 'warn' : 'off',

    // 组件名在html中用`PascalCase` `kebab-case`模式
    "vue/component-name-in-template-casing": ["error",  "PascalCase", {
      "registeredComponentsOnly": false, // 无法识别 ts 注册组件
      "ignores": ["/^el/", "/^vxe/"] // 插件的组件用`kebab-case` 自定义组件用`PascalCase`
    }],


    // 空标签闭合方式   // 选项 never any always // 这里除组件外, 交由eslint-plugin-prettier控制避免冲突
    "vue/html-self-closing": ["error", {
      "html": {
        "void": "any",   // img imput 等一般空标签 always
        "normal": "never", // <div></div> 普通空标签 never
        "component": "always"
      },
      "svg": "always",
      "math": "always"
    }],

    // 'vue/max-attributes-per-line': ['error', {
    //   singleline: 3,
    //   multiline: 1,
    // }],

    // "prettier/prettier": ["error", {}, {
    //   "usePrettierrc": true
    // }]


    // "vue/no-unsupported-features": ["error", {
    //   "version": "^2.6.0",
    //   "ignores": []
    // }]
    // quotes: ['warn', 'single'],
    // semi: ['warn', 'never']
  }
}
