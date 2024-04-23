import { NotebookModel } from '@jupyterlab/notebook';
import { commentIsVisible, toggleComment } from '../components/notebook';
import { NotebookMetadata } from '../components/types';

describe('sidestickies', () => {
  it('test for commentIsVisible', () => {
    const model = new NotebookModel();
    expect(commentIsVisible(model)).toEqual(false);
    model.setMetadata('sidestickies', { visible: true });
    expect(commentIsVisible(model)).toEqual(true);
    model.setMetadata('sidestickies', { visible: false });
    expect(commentIsVisible(model)).toEqual(false);
  });

  it('test for toggleComment', () => {
    const model = new NotebookModel();
    expect(toggleComment(model)).toEqual(true);
    let metadata = model.metadata as NotebookMetadata;
    expect(metadata.sidestickies).toEqual({ visible: true });
    model.setMetadata('sidestickies', { visible: true });
    expect(toggleComment(model)).toEqual(false);
    metadata = model.metadata as NotebookMetadata;
    expect(metadata.sidestickies).toEqual({ visible: false });
    model.setMetadata('sidestickies', { visible: false });
    expect(toggleComment(model)).toEqual(true);
    metadata = model.metadata as NotebookMetadata;
    expect(metadata.sidestickies).toEqual({ visible: true });
  });
});
