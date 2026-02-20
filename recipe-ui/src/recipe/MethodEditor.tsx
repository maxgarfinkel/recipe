import { forwardRef } from 'react';
import {
    headingsPlugin,
    linkPlugin,
    listsPlugin,
    markdownShortcutPlugin,
    MDXEditor,
    MDXEditorMethods,
    toolbarPlugin,
    UndoRedo,
    Separator,
    BoldItalicUnderlineToggles,
    BlockTypeSelect,
    ListsToggle,
} from '@mdxeditor/editor';
import '@mdxeditor/editor/style.css';

const PLUGINS = [
    toolbarPlugin({
        toolbarContents: () => (
            <>
                <UndoRedo />
                <Separator />
                <BlockTypeSelect />
                <Separator />
                <BoldItalicUnderlineToggles options={['Bold', 'Italic']} />
                <Separator />
                <ListsToggle options={['bullet', 'number']} />
            </>
        ),
    }),
    headingsPlugin(),
    listsPlugin(),
    linkPlugin(),
    markdownShortcutPlugin(),
];

interface Props {
    value: string;
    onChange: (value: string) => void;
}

const MethodEditor = forwardRef<MDXEditorMethods, Props>(({ value, onChange }, ref) => (
    <div className="border border-gray-200 rounded-xl overflow-hidden shadow-sm">
        <MDXEditor ref={ref} markdown={value} onChange={onChange} plugins={PLUGINS} />
    </div>
));

MethodEditor.displayName = 'MethodEditor';

export default MethodEditor;
