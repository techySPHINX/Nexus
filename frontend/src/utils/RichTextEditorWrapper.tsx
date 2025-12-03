import { Ref, forwardRef, useEffect, useImperativeHandle, useRef } from 'react';
import {
  RichTextEditor,
  ResizableImage,
  MenuControlsContainer,
  MenuDivider,
  MenuSelectHeading,
  MenuSelectTextAlign,
  MenuButtonBold,
  MenuButtonItalic,
  MenuButtonBulletedList,
  MenuButtonOrderedList,
  MenuButtonTextColor,
  MenuButtonHighlightColor,
  MenuButtonAddImage,
  MenuButtonImageUpload,
  MenuButtonUnderline,
  type RichTextEditorRef,
} from 'mui-tiptap';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Text from '@tiptap/extension-text';
import { Color, TextStyle } from '@tiptap/extension-text-style';
import Highlight from '@tiptap/extension-highlight';
import { ListItem, OrderedList } from '@tiptap/extension-list';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import { Editor } from '@tiptap/core';

type ImageNodeAttributes = { src: string; alt?: string; title?: string };

export type RichEditorRef = {
  editor: Editor | null;
};

type Props = {
  value?: string;
  onChange?: (html: string) => void;
  onUploadFiles?: (files: File[]) => Promise<ImageNodeAttributes[]>;
  minHeight?: number;
};

const RichTextEditorWrapper = forwardRef<RichEditorRef, Props>(
  ({ value, onChange, onUploadFiles, minHeight = 260 }, ref) => {
    const innerRef = useRef<RichEditorRef | null>(null);

    useImperativeHandle(ref, () => innerRef.current as RichEditorRef, []);

    useEffect(() => {
      const editor = innerRef.current?.editor;
      if (!editor || !onChange) return;
      const handler = () => onChange(editor.getHTML());
      editor.on('update', handler);
      return () => {
        editor.off('update', handler);
      };
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [innerRef.current?.editor, onChange]);

    // When the `value` prop changes externally, update editor content
    useEffect(() => {
      const editor = innerRef.current?.editor;
      if (!editor) return;
      const current = editor.getHTML();
      if (value != null && value !== current) {
        editor.commands.setContent(value || '<p></p>');
      }
    }, [value]);

    return (
      <RichTextEditor
        ref={innerRef as Ref<RichTextEditorRef>}
        extensions={[
          StarterKit,
          ResizableImage,
          Image,
          Text,
          Color,
          TextStyle,
          Underline,
          Highlight,
          ListItem,
          OrderedList,
          TextAlign.configure({ types: ['heading', 'paragraph'] }),
        ]}
        content={value || '<p></p>'}
        RichTextFieldProps={{ sx: { minHeight } }}
        renderControls={() => (
          <MenuControlsContainer>
            <MenuSelectHeading />
            <MenuDivider />
            <MenuButtonBold />
            <MenuButtonUnderline />
            <MenuButtonItalic />
            <MenuButtonTextColor />
            <MenuButtonHighlightColor />
            <MenuButtonBulletedList />
            <MenuButtonOrderedList />
            <MenuSelectTextAlign />
            <MenuButtonAddImage
              onClick={() => {
                const url = window.prompt('Image URL');
                if (url) {
                  innerRef.current?.editor
                    ?.chain()
                    .focus()
                    .setImage({ src: url })
                    .run();
                }
              }}
            />
            {onUploadFiles && (
              <MenuButtonImageUpload onUploadFiles={onUploadFiles} />
            )}
            <MenuDivider />
          </MenuControlsContainer>
        )}
      />
    );
  }
);

export default RichTextEditorWrapper;
