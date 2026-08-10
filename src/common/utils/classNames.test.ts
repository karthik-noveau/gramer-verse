import { classNames } from 'common/utils/classNames';

describe('classNames', () => {
  it('joins the names it is given', () => {
    expect(classNames('a', 'b')).toBe('a b');
  });

  it('drops everything falsy, including the empty string', () => {
    expect(classNames('a', false, null, undefined, '', 'b')).toBe('a b');
  });

  it('is empty when nothing survives', () => {
    expect(classNames(false, undefined)).toBe('');
  });
});
