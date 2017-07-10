import commonjs from 'rollup-plugin-commonjs';
import nodeResolve from 'rollup-plugin-node-resolve';

import config from './rollup.base.config';

config.plugins.push(
  nodeResolve({
    jsnext: true,
    browser: true,
    preferBuiltins: true
  }),
  commonjs()
);

config.format = 'umd';
config.dest = 'dist/stratumn-agent-client.js';

export default config;
