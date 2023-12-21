import { createAtom, lazy, component, useAtom, element, text } from '..';
import { describe, it } from 'vitest';

describe('types', () => {
    it('event listeners', () => {
        element('input', { style: 'margin: 10px', oninput: e => console.log(e.target.value), slot: text('bar') });
        element('button', { style: 'margin: 10px', onclick: e => console.log(e.currentTarget.id), slot: text('bar') });
    });


    it('props', () => {
        interface FooProps {
            foo: 'bar' | 'baz'
        }
        
        const Foo = (props: FooProps) => {
            return text(props.foo);
        };
        
        // correct usage
        component(Foo, { foo: 'baz' });

        // omit props
        // @ts-expect-error
        component(Foo);

        // extra props
        // @ts-expect-error
        component(Foo, { foo: 'bar', baz: '' });

        // omit props
        // @ts-expect-error
        component(Foo, {});

        const Child = () => element('div', { slot: text('foo'), id: 'foo' });
        const LazyChild = lazy({
            import: () => new Promise<{ default: typeof Child}>(r => setTimeout(() => r({ default: Child }), 10)),
            fallback: element('p', { slot: text('loading') }),
        });

        component(LazyChild);

        // @ts-expect-error
        component(LazyChild, { foo: 'asdf' });

        element('div', {
            contentEditable: true,
            oninput: e => console.log(e.target.innerText),
            slot: text('hi'),
        });

        // atoms
        const foo = createAtom<number | null>(null);
        let use = () => useAtom(foo);
    });
});
