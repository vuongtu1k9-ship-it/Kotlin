import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const MONGO_URL = process.env.MONGO_URL || 'mongodb://127.0.0.1:27017';
const client = new MongoClient(MONGO_URL);

function makeSlug(text) {
  if (!text) return '';
  return text.toString().toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd').replace(/[^\w\s-]/g, '')
    .trim().replace(/\s+/g, '-').replace(/-+/g, '-').slice(0, 80);
}

const LESSONS = [
  {
    id: 'basic-lo-mat-tuong',
    title: 'Cơ bản: Quy tắc Lộ Mặt Tướng',
    category: 'Cơ bản',
    difficulty: 'Dễ',
    reward: 20,
    description: 'Tìm hiểu quy tắc cốt lõi trong cờ tướng: Hai quân Tướng không được nhìn thấy mặt nhau.',
    content: `<h2>Quy tắc Lộ Mặt Tướng (Phi Tướng)</h2>
<p>Một trong những đặc trưng thú vị nhất của cờ tướng là quy tắc <strong>"Lộ mặt Tướng"</strong>. Hai vị Tướng (Súy/Tướng) tuyệt đối <em>không được nằm trên cùng một cột dọc nếu không có quân nào che chắn ở giữa</em>.</p>
<p>Nếu một bên đi một nước cờ khiến hai Tướng "chạm trán" nhau (tức là nằm trên cùng 1 cột và không có quân che), nước đi đó là <strong>phạm luật</strong>. Thậm chí, Tướng có thể được sử dụng như một quân tấn công từ xa (thường gọi là "mặt Tướng") để hỗ trợ các quân khác chiếu bí đối phương.</p>
<p>Hãy xem ví dụ dưới đây. Xe Đỏ đang đe dọa Sĩ Đen. Nhưng điểm mấu chốt là Tướng Đỏ ở vị trí lộ mặt, hỗ trợ đắc lực cho đòn tấn công tiếp theo.</p>`,
    boards: [{
      id: 'primary', title: 'Thực hành Lộ mặt Tướng', description: 'Tướng đứng thẳng cột tạo sát cơ',
      fen: '3ak4/9/9/9/9/9/9/9/3R5/4K4 w - - 0 1',
      moves: ''
    }]
  },
  {
    id: 'khai-cuoc-bpm',
    title: 'Khai cuộc: Bình Phong Mã - Hệ thống phòng ngự',
    category: 'Khai cuộc',
    difficulty: 'Trung bình',
    reward: 40,
    description: 'Khám phá thế trận Bình Phong Mã, bức tường thép chống lại Pháo Đầu.',
    content: `<h2>Thế Trận Bình Phong Mã (屏风马)</h2>
<p>Khi đối phương đi nước đầu tiên là <strong>Pháo Đầu (Trung Pháo)</strong>, một trong những hệ thống phòng ngự kiên cố và phản công sắc bén nhất là <strong>Bình Phong Mã</strong>.</p>
<h3>Đặc điểm của Bình Phong Mã</h3>
<ul>
  <li>Hai quân Mã tiến lên bảo vệ hai Tốt đầu (Tốt 3 và Tốt 7).</li>
  <li>Hai Mã liên kết chặt chẽ, che chắn lẫn nhau tạo thành một "bức bình phong" bảo vệ khu vực trung tâm (Cửu Cung).</li>
  <li>Hệ thống này rất linh hoạt, có thể biến hóa thành nhiều loại hình chiến thuật ở trung cuộc.</li>
</ul>
<p>Hãy tự do di chuyển các quân để cảm nhận sự vững chắc của trận đồ này.</p>`,
    boards: [{
      id: 'primary', title: 'Pháo Đầu đối Bình Phong Mã', description: 'Trận đồ kinh điển',
      fen: 'rnbakabnr/9/1c5c1/p1p1p1p1p/9/9/P1P1P1P1P/1C5C1/9/RNBAKABNR w - - 0 1',
      moves: 'h2e2 h9g7 h0g2 i9h9 i0h0 a9b9'
    }]
  },
  {
    id: 'trung-cuoc-thiet-mon-ham',
    title: 'Sát pháp: Thiết Môn Hãm (Chốt cửa sắt)',
    category: 'Trung cuộc',
    difficulty: 'Khó',
    reward: 50,
    description: 'Tuyệt kỹ dùng Pháo và Xe khóa chết Tướng đối phương trong Cung.',
    content: `<h2>Thiết Môn Hãm (铁门栓)</h2>
<p><strong>Thiết Môn Hãm</strong> là một đòn sát pháp cực kỳ sắc bén và ác liệt trong cờ tướng. Ý nghĩa của tên gọi này là "Chốt cửa bằng sắt", khóa chặt không cho Tướng đối phương tẩu thoát.</p>
<h3>Điều kiện hình thành:</h3>
<ol>
  <li><strong>Pháo Đầu:</strong> Một quân Pháo (thường là Pháo Đầu) khống chế chặt trục tung (đường số 5), ghim chết Tướng đối phươg ở vị trí ban đầu.</li>
  <li><strong>Xe (hoặc Tốt):</strong> Đột nhập vào điểm "yết hầu" (Cửu Cung) ở một trong hai bên sườn, chiếu bí.</li>
</ol>
<p>Ở ví dụ dưới, Pháo Đỏ đang kiểm soát đường giữa. Xe Đỏ chỉ cần tiến xuống chiếu là Đen hết đường đỡ.</p>`,
    boards: [{
      id: 'primary', title: 'Thế Thiết Môn Hãm', description: 'Xe Đỏ phối hợp Pháo Đầu tạo sát',
      fen: '3ka4/3R5/9/9/9/9/9/9/9/4C4 w - - 0 1',
      moves: ''
    }]
  },
  {
    id: 'tan-cuoc-don-xe-si',
    title: 'Tàn cuộc: Đơn Xe thắng Đơn Sĩ',
    category: 'Tàn cuộc',
    difficulty: 'Trung bình',
    reward: 60,
    description: 'Nghệ thuật điều Xe và mặt Tướng ép chết Sĩ trong tàn cuộc.',
    content: `<h2>Nghệ Thuật Cầm Xe Đơn Độc</h2>
<p>Trong tàn cuộc cờ tướng, một con Xe cô đơn là nỗi khiếp sợ với những đối thủ thiếu phòng bị. Nếu Đen chỉ còn Đơn Sĩ, Xe có thể dùng kỹ thuật khéo léo để bắt chết Sĩ và giành phần thắng.</p>
<p>Mấu chốt của tàn cục này là dùng mặt Tướng để cấm cung, đồng thời dùng Xe khống chế lộ di chuyển của Sĩ. Khi Sĩ Đen bị ép vào góc tử, chiến thắng sẽ thuộc về Đỏ.</p>`,
    boards: [{
      id: 'primary', title: 'Tàn cuộc Đơn Xe', description: 'Đỏ đi tiên thắng',
      fen: '3k5/3a5/9/9/9/9/9/9/9/3R1K3 w - - 0 1',
      moves: ''
    }]
  },
  {
    id: 'co-the-thi-xe',
    title: 'Cờ Thế: Thí Xe Định Giang Sơn',
    category: 'Cờ Thế',
    difficulty: 'Rất Khó',
    reward: 80,
    description: 'Một thế cờ giang hồ đặc sắc, nơi sự hy sinh tạo nên sát cục vi diệu.',
    content: `<h2>Thí Xe - Nghệ Thuật Hy Sinh</h2>
<p>Cờ thế giang hồ luôn ẩn chứa những nước đi bất ngờ. Đôi khi, bạn phải chấp nhận hy sinh quân cờ mạnh nhất của mình (quân Xe) để mở đường cho các quân khác tung đòn quyết định.</p>
<p>Lực lượng quân Đen đang áp đảo và chuẩn bị chiếu sát. Đỏ bắt buộc phải liên tục chiếu Tướng, không được phép chậm trễ dù chỉ nửa nhịp.</p>`,
    boards: [{
      id: 'primary', title: 'Thế Cờ Thí Xe', description: 'Đỏ phải liên tục chiếu bí',
      fen: '4k4/4a4/9/9/9/9/9/9/9/R3K4 w - - 0 1', 
      moves: ''
    }]
  },
  {
    id: 'tran-dau-ttn',
    title: 'Trận Đấu: Nét tinh hoa của Danh Thủ',
    category: 'Trận đấu',
    difficulty: 'Trung bình',
    reward: 50,
    description: 'Phân tích một nước đi xuất thần phá vỡ cấu trúc phòng ngự.',
    content: `<h2>Tinh hỏa liệu nguyên - Nước cờ xuất thần</h2>
<p>Trong các giải đấu đỉnh cao, luôn có những khoảnh khắc làm nức lòng người hâm mộ bởi phong cách tấn công dũng mãnh và khả năng tính toán sâu xa xuất quỷ nhập thần.</p>
<p>Trong một thế trận Trung cuộc phức tạp, việc nắm bắt đúng thời cơ tàn phá cấu trúc phòng ngự của đối phương là yếu tố quyết định. Lựa chọn thời điểm hy sinh quân chính xác sẽ tạo nên lợi thế không thể vãn hồi.</p>`,
    boards: [{
      id: 'primary', title: 'Trung cuộc tiêu biểu', description: 'Nước đi phá vỡ cấu trúc',
      fen: 'r1bakab1r/9/1cn1c1n1c/p1p1p1p1p/9/9/P1P1P1P1P/1C5C1/9/RNBAKABNR w - - 0 1',
      moves: ''
    }]
  }
];

async function seed() {
  try {
    await client.connect();
    const db = client.db('xiangqi');
    const col = db.collection('practice_lessons');

    // CLEAR existing lessons completely to ensure high-quality replacements
    await col.deleteMany({});
    console.log('Cleared all legacy messy lessons.');

    console.log(`Adding ${LESSONS.length} high-quality, expert-level lessons...\n`);
    for (const lesson of LESSONS) {
      const slug = makeSlug(lesson.title);
      const categorySlug = makeSlug(lesson.category);
      const update = { ...lesson, slug, categorySlug, updatedAt: new Date() };
      await col.updateOne({ id: lesson.id }, { $set: update }, { upsert: true });
      console.log(`  ✓ [${lesson.category}] ${lesson.title}`);
    }

    console.log('\n✅ Done! Data seeded successfully.');
  } catch (e) {
    console.error('Failed:', e);
  } finally {
    await client.close();
  }
}

seed();
