import { gradeAnswer } from '../src/flashcards/generator';

const assert = (cond: boolean, msg: string) => {
  if (!cond) throw new Error(msg);
};

assert(gradeAnswer('6+', '6', 'auto'), '6+ accepts 6');
assert(gradeAnswer('6+', '6+', 'auto'), '6+ accepts 6+');
assert(gradeAnswer('6', '6+', 'auto'), '6 accepts 6+');
assert(gradeAnswer('3+', '3', 'auto'), '3+ accepts 3');
assert(!gradeAnswer('6+', '7', 'auto'), '6+ rejects 7');
assert(!gradeAnswer('6+', '60', 'auto'), '6+ rejects 60');
assert(gradeAnswer('10+', '10', 'auto'), '10+ accepts 10');
assert(gradeAnswer('12"', '12', 'auto'), '12" accepts 12');
assert(gradeAnswer('12"', '12"', 'auto'), '12" accepts 12"');
assert(gradeAnswer('M12"', '12', 'auto'), 'M12" accepts 12');
assert(gradeAnswer('M12"', 'M12', 'auto'), 'M12" accepts M12');
assert(gradeAnswer('6"', '6', 'auto'), '6" accepts 6');
assert(gradeAnswer('24"', '24', 'auto'), '24" accepts 24 for range');
assert(gradeAnswer('-1', '1', 'auto'), '-1 AP accepts 1');
assert(gradeAnswer('-2', '2', 'auto'), '-2 AP accepts 2');
assert(gradeAnswer('-2', '-2', 'auto'), '-2 AP accepts -2');
assert(gradeAnswer('−1', '1', 'auto'), 'unicode minus AP accepts 1');
assert(gradeAnswer('d6+1', 'd6+1', 'pattern'), 'd6+1 exact match');
assert(gradeAnswer('D6+1', 'd6+1', 'pattern'), 'd6+1 case insensitive');
assert(!gradeAnswer('d6+1', 'd6', 'pattern'), 'd6+1 does not accept d6 alone');

console.log('All gradeAnswer tests passed.');
