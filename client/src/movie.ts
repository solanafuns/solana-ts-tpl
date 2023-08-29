import * as borsh from "@project-serum/borsh";

export class Movie {
  title: string;
  rating: number;
  description: string;

  // 构造函数和模拟将保持不变
  constructor(title: string, rating: number, description: string) {
    this.title = title;
    this.rating = rating;
    this.description = description;
  }

  serialize(): Buffer {
    const buffer = Buffer.alloc(1000); // 创建一个1000字节的缓冲区
    this.borshInstructionSchema.encode({ ...this, variant: 0 }, buffer); // 使用模式对数据进行编码
    return buffer.slice(0, this.borshInstructionSchema.getSpan(buffer)); // 返回缓冲区中的有效数据部分
  }

  static mocks: Movie[] = [];

  // 这里是我们的架构定义！
  borshInstructionSchema = borsh.struct([
    borsh.u8("variant"),
    borsh.str("title"),
    borsh.u8("rating"),
    borsh.str("description"),
  ]);
}
