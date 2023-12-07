import { createAtom, lazy, rendr, useAtom, div, p, input, button } from '..';
import { describe, it } from 'vitest';

describe('types', () => {
    it('event listeners', () => {
        input({ style: 'margin: 10px', oninput: e => console.log(e.target.value), slot: 'bar' });
        button({ style: 'margin: 10px', onclick: e => console.log(e.currentTarget.id), slot: 'bar' });
    });


    it('props', () => {
        interface FooProps {
            foo: 'bar' | 'baz'
        }
        
        const Foo = (props: FooProps) => {
            return props.foo;
        };
        
        // correct usage
        rendr(Foo, { foo: 'baz' });

        // omit props
        // @ts-expect-error
        rendr(Foo);

        // extra props
        // @ts-expect-error
        rendr(Foo, { foo: 'bar', baz: '' });

        // omit props
        // @ts-expect-error
        rendr(Foo, {});

        const Child = () => div({ slot: 'foo', id: 'foo' });
        const LazyChild = lazy({
            import: () => new Promise<{ default: typeof Child}>(r => setTimeout(() => r({ default: Child }), 10)),
            fallback: p({ slot: 'loading' }),
        });

        rendr(LazyChild);

        // @ts-expect-error
        rendr(LazyChild, { foo: 'asdf' });

        div({
            contentEditable: true,
            oninput: e => console.log(e.target.innerText),
            slot: 'hi',
        });

        // atoms
        const foo = createAtom<number | null>(null);
        let use = () => useAtom(foo);
    });
});
