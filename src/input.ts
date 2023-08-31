export class Inputs {
  filename: string;
  patches: string;

  constructor(filename = '', patch = '') {
    this.filename = filename;
    this.patches = patch;
  }
  render(content: string): string {
    if (!content) {
      return '';
    }
    if (this.filename) {
      content = content.replace('$filename', this.filename);
    }
    if (this.patches) {
      content = content.replace('$patch', this.patches);
    }
    return content;
  }
}
