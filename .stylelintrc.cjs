module.exports = {
  root: true,
  extends: [
    'stylelint-config-standard',
    'stylelint-config-standard-scss',
    'stylelint-config-recommended-vue/scss',
    'stylelint-config-recess-order',
    'stylelint-config-prettier',
  ],
  rules: {
    'color-function-notation': null,
    'function-url-quotes': null,
    'property-no-vendor-prefix': null,
  },
  overrides: [
    {
      files: ['**/*.{vue,html}'],
      customSyntax: 'postcss-html',
    },
  ],
};
