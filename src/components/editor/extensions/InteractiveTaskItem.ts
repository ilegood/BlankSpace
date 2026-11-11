import { TaskItem as BuiltInTaskItem } from '@tiptap/extension-task-item';

/**
 * Custom Interactive TaskItem Extension
 * - Allows checking/unchecking checkboxes in both View (Read-Only) and Edit modes
 * - Automatically updates document state and triggers auto-save on toggle
 */
export const InteractiveTaskItem = BuiltInTaskItem.extend({
  addNodeView() {
    return ({ node, HTMLAttributes, getPos, editor }) => {
      const listItem = document.createElement('li');
      const checkboxWrapper = document.createElement('label');
      const checkbox = document.createElement('input');
      const content = document.createElement('div');

      checkboxWrapper.contentEditable = 'false';
      checkbox.type = 'checkbox';
      checkbox.checked = !!node.attrs.checked;

      // Prevent focus jumps on click
      checkbox.addEventListener('mousedown', (event) => {
        event.stopPropagation();
      });

      // Handle Toggle in BOTH edit mode and view (read-only) mode
      checkbox.addEventListener('change', (event) => {
        const target = event.target as HTMLInputElement;
        const checked = target.checked;

        if (typeof getPos === 'function') {
          const position = getPos();
          if (typeof position === 'number') {
            const { tr } = editor.view.state;
            const currentNode = tr.doc.nodeAt(position);
            tr.setNodeMarkup(position, undefined, {
              ...currentNode?.attrs,
              checked,
            });
            editor.view.dispatch(tr);
          }
        }
      });

      // Apply static & dynamic attributes
      Object.entries(this.options.HTMLAttributes).forEach(([key, value]) => {
        listItem.setAttribute(key, value);
      });
      Object.entries(HTMLAttributes).forEach(([key, value]) => {
        listItem.setAttribute(key, value);
      });

      listItem.dataset.checked = String(node.attrs.checked);
      checkboxWrapper.append(checkbox);
      listItem.append(checkboxWrapper, content);

      return {
        dom: listItem,
        contentDOM: content,
        update: (updatedNode) => {
          if (updatedNode.type !== this.type) return false;
          listItem.dataset.checked = String(updatedNode.attrs.checked);
          checkbox.checked = !!updatedNode.attrs.checked;
          return true;
        },
      };
    };
  },
});

