import { config } from '@greese-ui/eslint-config/base'
import tseslint from 'typescript-eslint'

export default [...config, ...tseslint.configs.recommended]
