module.exports = {
  processors: [],
  plugins: ['stylelint-order'],
  extends: [
    'stylelint-config-standard',
    'stylelint-config-sass-guidelines',
    // 'stylelint-config-idiomatic-order'
    'stylelint-config-recess-order'
  ],
  rules: {
    'order/order': [],
    'order/properties-alphabetical-order': null,
    'at-rule-empty-line-before': 'always',
    'at-rule-name-case': 'lower',
    'block-no-empty': true,
    'font-family-no-missing-generic-family-keyword': [
      true,
      {
        ignoreFontFamilies: ['PingFangSC']
      }
    ],
    'selector-pseudo-element-no-unknown': [
      true,
      {
        ignorePseudoElements: ['v-deep', '::v-deep']
      }
    ],
    'selector-max-compound-selectors': 100,
    'max-nesting-depth': 100,
    'selector-class-pattern': ['.+'],
    'scss/dollar-variable-pattern': '.+',
    'selector-max-id': 100
  },
  ignoreFiles: ['node_modules', 'dist_electron', 'dist']
}
