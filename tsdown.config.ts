import { pathToFileURL } from 'node:url'

const { clientBundle } = await import(pathToFileURL('D:/deepseek-harness/packages/client/tsdown.client.ts').href)

export default clientBundle('dsh-simple-git', ['lib/types/index.js', 'lib/types/invariant.js'])
