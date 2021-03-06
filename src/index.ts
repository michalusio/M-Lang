import { ParseFile } from 'parser-combinators';
import { ParseError } from 'parser-combinators/types';

import { check } from './checkers/checker';
import { program } from './language/program';
import { optimize } from './optimizers/optimizer';

console.time('parsing');
try {
  const res = ParseFile('./scripts/script.mlang', program());
  console.timeEnd('parsing');
  if (res) {
    console.time('checking');
    const checked = check(res);
    console.timeEnd('checking');
    if (checked) {
      console.time('optimizing');
      const optimized = optimize(res);
      console.timeEnd('optimizing');
      console.log(JSON.stringify(optimized, null, 2));
    }
  }
} catch (e) {
  if (e instanceof ParseError) {
    console.error(e.getPrettyErrorMessage());
  } else throw e;
}