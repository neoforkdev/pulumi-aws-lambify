import { Parser } from '../model/interfaces/parser';

export class DirectoryParser implements Parser<Directory> {
  parse(input: string): Result<Directory> {
    return { success: true, value: input };
  }
}
