/**
 * Add lessons for "Cờ Thế" and "Trận đấu" categories
 */
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

const NEW_LESSONS = [
  // ===== CỜ THẾ (Co The) — Puzzle / Tactics positions =====
  {
    id: 'cothe-1',
    title: 'Cờ Thế: Hổ Nhảy Tường Đá',
    category: 'Cờ Thế',
    difficulty: 'Trung bình',
    reward: 45,
    description: 'Thế cờ cổ điển — Xe Pháo phối hợp tạo đòn chiếu bí tuyệt đẹp.',
    content: `<h2>🐯 Cờ Thế: Hổ Nhảy Tường Đá</h2>
<p>Đây là thế cờ truyền thống xuất hiện trong nhiều sách cờ cổ điển Trung Hoa. Bên Đỏ đang ở thế thắng nhưng cần tìm đúng nước đi để kết thúc nhanh chóng.</p>
<h3>Phân tích thế cờ</h3>
<ul>
  <li>Đỏ có lợi thế về quân và vị trí.</li>
  <li>Tướng Đen đang bị co hẹp không gian.</li>
  <li>Cần phối hợp <strong>Xe + Pháo</strong> để tạo thế chiếu bí liên hoàn.</li>
</ul>
<p>[board fen="2bak4/4a4/4b4/9/9/9/9/4B4/4A4/R3KA3 w - - 0 1" title="Hổ Nhảy Tường Đá" size="md"]</p>
<p><strong>🔴 Đỏ đi trước — Chiếu bí trong 3 nước!</strong></p>`,
    boards: [{
      id: 'primary', title: 'Hổ Nhảy Tường Đá', description: 'Đỏ đi trước chiếu bí',
      fen: '2bak4/4a4/4b4/9/9/9/9/4B4/4A4/R3KA3 w - - 0 1',
      moves: 'a0e0 d9e9 e0e9'
    }]
  },
  {
    id: 'cothe-2',
    title: 'Cờ Thế: Thiên Địa Pháo',
    category: 'Cờ Thế',
    difficulty: 'Trung bình',
    reward: 45,
    description: 'Hai Pháo thượng hạ phối hợp — thế chiếu bí liên hoàn đẹp nhất trong cờ tướng cổ.',
    content: `<h2>💣💣 Thiên Địa Pháo (天地炮)</h2>
<p><strong>Thiên Địa Pháo</strong> là thế hai Pháo đứng trên-dưới cùng cột, tạo ra thế kiểm soát toàn cột và chiếu bí cực kỳ hiệu quả.</p>
<h3>Nguyên lý</h3>
<ul>
  <li>Pháo trên (Thiên Pháo) kiểm soát phần trên bàn cờ.</li>
  <li>Pháo dưới (Địa Pháo) khống chế phần dưới.</li>
  <li>Hai Pháo cùng cột tạo ra thế <em>lưỡng lộ chiếu</em> — đối phương không thể giải cả hai.</li>
</ul>
<p>[board fen="3k5/9/3C5/9/9/9/3C5/9/9/3K5 w - - 0 1" title="Thiên Địa Pháo" size="md"]</p>
<p><strong>🔴 Quan sát thế Thiên Địa Pháo và thử tìm chiếu bí!</strong></p>`,
    boards: [{
      id: 'primary', title: 'Thiên Địa Pháo', description: 'Hai Pháo cùng cột kiểm soát hoàn toàn',
      fen: '3k5/9/3C5/9/9/9/3C5/9/9/3K5 w - - 0 1',
      moves: 'g6g1 d9d8 d2d9'
    }]
  },
  {
    id: 'cothe-3',
    title: 'Cờ Thế: Xe Song Xa Bắt Tướng',
    category: 'Cờ Thế',
    difficulty: 'Dễ',
    reward: 30,
    description: 'Bài tập thực hành — dùng hai Xe bắt tướng trong thế đơn giản.',
    content: `<h2>🛒🛒 Song Xa Chiếu Tướng</h2>
<p>Thế cờ nhập môn cho người mới học. Bên Đỏ có hai Xe ở vị trí lý tưởng — chỉ cần tìm trình tự đúng để chiếu bí.</p>
<h3>Gợi ý</h3>
<ul>
  <li>Dùng một Xe khóa Tướng đen trên hàng ngang.</li>
  <li>Xe còn lại đánh vào cột trung.</li>
  <li>Tướng đen không còn đường thoát!</li>
</ul>
<p>[board fen="3k5/9/9/9/9/9/9/9/8R/2KR5 w - - 0 1" title="Song Xa chiếu Tướng" size="md"]</p>
<p><strong>🔴 Tìm chiếu bí trong 2 nước!</strong></p>`,
    boards: [{
      id: 'primary', title: 'Song Xa chiếu Tướng', description: 'Bài tập cơ bản song xa',
      fen: '3k5/9/9/9/9/9/9/9/8R/2KR5 w - - 0 1',
      moves: 'h1d1 d9d8 i1i9'
    }]
  },
  {
    id: 'cothe-4',
    title: 'Cờ Thế: Pháo Đánh Mã — Trao Đổi Quân',
    category: 'Cờ Thế',
    difficulty: 'Khó',
    reward: 60,
    description: 'Thế cờ nâng cao — nhận diện khi nào nên trao đổi quân để giành thế thắng.',
    content: `<h2>🧩 Pháo Đánh Mã — Quyết định trao đổi quân</h2>
<p>Trong cờ tướng, <strong>trao đổi quân</strong> (bắt quân đối phương bằng cách để mất quân của mình) là kỹ năng quan trọng. Bạn cần nhận ra khi nào thì trao đổi có lợi.</p>
<h3>Nguyên tắc trao đổi quân</h3>
<ul>
  <li>💹 <strong>Giá trị quân</strong>: Xe > Mã = Pháo > Tốt/Binh. Ăn Xe bằng Mã = lời!</li>
  <li>🎯 <strong>Vị trí</strong>: Quân ở vị trí hoạt động tốt > đứng yên.</li>
  <li>⏰ <strong>Thời điểm</strong>: Trao đổi để mở cột cho Xe, loại quân phòng thủ then chốt.</li>
</ul>
<p>[board fen="r1bakab1r/9/1cn1c1n1c/p1p1p1p1p/9/9/P1P1P1P1P/1C5C1/9/RNBAKABNR w - - 0 1" title="Phân tích thế trao đổi" size="md"]</p>
<p>Quan sát: <strong>Pháo đỏ có thể ăn Mã đen ở c6 không? Sau đó điều gì xảy ra?</strong></p>`,
    boards: [{
      id: 'primary', title: 'Trao đổi quân phân tích', description: 'Phân tích thế trao đổi',
      fen: 'r1bakab1r/9/1cn1c1n1c/p1p1p1p1p/9/9/P1P1P1P1P/1C5C1/9/RNBAKABNR w - - 0 1',
      moves: ''
    }]
  },

  // ===== TRẬN ĐẤU (Match Analysis) =====
  {
    id: 'trandau-1',
    title: 'Phân tích ván: Xe độc chiếu thắng',
    category: 'Trận đấu',
    difficulty: 'Trung bình',
    reward: 50,
    description: 'Phân tích ván đấu thực tế — bên yếu hơn về quân nhưng vẫn thắng nhờ kỹ thuật Xe.',
    content: `<h2>🎮 Phân tích ván đấu: Xe đơn độc thắng</h2>
<p>Trong cờ tướng chuyên nghiệp, kỹ năng đọc trận và dự đoán nước đi của đối thủ là yếu tố then chốt. Ván đấu này minh họa nguyên tắc <strong>"thiểu số thắng đa số"</strong> khi Xe được đặt đúng vị trí.</p>
<h3>Bài học từ ván đấu</h3>
<ul>
  <li>🏆 <strong>Hoạt lực quân</strong>: Xe ở vị trí tốt mạnh hơn nhiều quân yếu.</li>
  <li>📍 <strong>Kiểm soát cột trung</strong>: Cột e là cột quan trọng nhất.</li>
  <li>⚡ <strong>Tốc độ</strong>: Tấn công nhanh trước khi đối phương ổn định.</li>
</ul>
<p>[board fen="3k1ab2/4a4/4b2R1/9/9/9/9/9/9/3K5 w - - 0 1" title="Thế thắng với đơn Xe" size="md"]</p>
<p><strong>🔴 Đỏ chỉ có một Xe — tìm chuỗi nước chiếu bí!</strong></p>`,
    boards: [{
      id: 'primary', title: 'Đơn Xe chiếu bí', description: 'Tình huống từ ván đấu thực tế',
      fen: '3k1ab2/4a4/4b2R1/9/9/9/9/9/9/3K5 w - - 0 1',
      moves: 'h2d2 d9e9 d2d9 e8d8 d9e9'
    }]
  },
  {
    id: 'trandau-2',
    title: 'Phân tích ván: Tấn công Khai cuộc Trung Pháo',
    category: 'Trận đấu',
    difficulty: 'Trung bình',
    reward: 50,
    description: 'Theo dõi và phân tích ván đấu hoàn chỉnh từ khai cuộc Trung Pháo đến tàn cuộc.',
    content: `<h2>📖 Phân tích: Trung Pháo vs Bình Phong Mã</h2>
<p>Đây là một trong những cặp khai cuộc phổ biến nhất. Bên Đỏ chọn <strong>Trung Pháo</strong>, bên Đen chọn <strong>Bình Phong Mã</strong> phòng thủ.</p>
<h3>Diễn biến điển hình</h3>
<ol>
  <li>炮二平五 — Pháo đỏ vào trung (Trung Pháo)</li>
  <li>馬8進7 — Mã đen lên g7 (Bình Phong Mã)</li>
  <li>馬二進三 — Mã đỏ lên c2</li>
  <li>車9平8 — Xe đen sang b9 (triển khai)</li>
  <li>車一平二 — Xe đỏ sang b0 (đối Xe)</li>
</ol>
<p>[board fen="rnbakabnr/9/1c5c1/p1p1p1p1p/9/9/P1P1P1P1P/1C5C1/9/RNBAKABNR w - - 0 1" title="Vị trí xuất phát" size="md"]</p>
<p>Hãy thử chơi ra và quan sát sự phát triển của từng bên!</p>`,
    boards: [
      {
        id: 'start', title: 'Vị trí xuất phát', description: 'Bắt đầu ván cờ',
        fen: 'rnbakabnr/9/1c5c1/p1p1p1p1p/9/9/P1P1P1P1P/1C5C1/9/RNBAKABNR w - - 0 1',
        moves: 'b2e2 h9g7 h0g2 i9h9 i0h0'
      },
      {
        id: 'midgame', title: 'Sau khai cuộc 10 nước', description: 'Thế cờ sau 10 nước',
        fen: 'r1bakab1r/9/1cn1c1n1c/p1p1p1p1p/9/9/P1P1P1P1P/2N4C1/9/R1BAKABN1 w - - 5 10',
        moves: ''
      }
    ]
  },
  {
    id: 'trandau-3',
    title: 'Chiến thuật: Hy sinh quân để thắng',
    category: 'Trận đấu',
    difficulty: 'Khó',
    reward: 70,
    description: 'Bài học nâng cao về kỹ thuật hy sinh quân có tính toán để giành thế thắng chiến lược.',
    content: `<h2>💡 Hy sinh quân có tính toán (Sacrifice)</h2>
<p><strong>Hy sinh quân</strong> là kỹ thuật cao cấp — cố tình để mất quân nhằm đổi lấy lợi thế lớn hơn: vị trí, tốc độ tấn công, hay chiếu bí trực tiếp.</p>
<h3>Các dạng hy sinh quân</h3>
<ul>
  <li>🎯 <strong>Hy sinh để mở đường tấn công</strong>: Tốt hy sinh để Xe chiếm cột hoặc hàng.</li>
  <li>⚡ <strong>Hy sinh để tăng tốc</strong>: Mất Mã để Pháo vào vị trí chiếu bí trong 2 nước.</li>
  <li>🔒 <strong>Hy sinh để phá khóa</strong>: Mất quân để loại Sĩ/Tượng then chốt của đối phương.</li>
</ul>
<p>[board fen="3k5/4a4/3Cb4/4N4/9/9/9/9/9/3K5 w - - 0 1" title="Hy sinh Mã để chiếu bí" size="md"]</p>
<p><strong>🔴 Đỏ hy sinh Mã — tìm chuỗi nước chiếu bí 3 nước!</strong></p>`,
    boards: [{
      id: 'primary', title: 'Hy sinh Mã', description: 'Mã đỏ hy sinh để mở đường Pháo',
      fen: '3k5/4a4/3Cb4/4N4/9/9/9/9/9/3K5 w - - 0 1',
      moves: 'e6d8 d9e9 d7d9'
    }]
  },
  {
    id: 'trandau-4',
    title: 'Chiến thuật: Đọc nước đối thủ',
    category: 'Trận đấu',
    difficulty: 'Khó',
    reward: 60,
    description: 'Rèn luyện khả năng dự đoán ý định của đối thủ và chuẩn bị phòng thủ tối ưu.',
    content: `<h2>🧠 Đọc ý đồ đối thủ</h2>
<p>Kỳ thủ giỏi không chỉ tính toán nước của mình mà còn phải <strong>đọc được ý định của đối phương</strong> — để phòng thủ chủ động thay vì phản ứng bị động.</p>
<h3>Câu hỏi tự đặt ra sau mỗi nước đối thủ đi</h3>
<ul>
  <li>❓ "Nước vừa rồi <strong>đe dọa</strong> điều gì?"</li>
  <li>❓ "Đối thủ muốn <strong>đi nước tiếp theo</strong> là gì?"</li>
  <li>❓ "Tôi có thể <strong>phòng thủ</strong> và <strong>tấn công</strong> đồng thời không?"</li>
</ul>
<h3>Kỹ thuật đọc nước</h3>
<ul>
  <li>🔍 Tìm quân "nguy hiểm nhất" của đối thủ.</li>
  <li>🗺️ Xác định khu vực bị đe dọa.</li>
  <li>🎯 Tìm nước phòng thủ cũng đồng thời cải thiện vị trí của mình.</li>
</ul>
<p>[board fen="r1bakabnr/9/1cn1c1b1c/p1p3p1p/9/2p6/P1P1P1P1P/1C2B1NC1/9/RNBAKA2R w - - 0 1" title="Đọc ý đồ đối thủ" size="md"]</p>
<p><strong>Đen vừa đẩy Tốt c lên c5 (c3 trong ký hiệu FIDE). Đỏ nên phản ứng thế nào?</strong></p>`,
    boards: [{
      id: 'primary', title: 'Phân tích thế trận', description: 'Tìm nước phòng thủ tối ưu',
      fen: 'r1bakabnr/9/1cn1c1b1c/p1p3p1p/9/2p6/P1P1P1P1P/1C2B1NC1/9/RNBAKA2R w - - 0 1',
      moves: ''
    }]
  },
];

async function seed() {
  try {
    await client.connect();
    const db = client.db('xiangqi');
    const col = db.collection('practice_lessons');

    console.log(`Adding ${NEW_LESSONS.length} new lessons...\n`);
    for (const lesson of NEW_LESSONS) {
      const slug = makeSlug(lesson.title);
      const categorySlug = makeSlug(lesson.category);
      const update = { ...lesson, slug, categorySlug, updatedAt: new Date() };
      await col.updateOne({ id: lesson.id }, { $set: update }, { upsert: true });
      console.log(`  ✓ [${lesson.category}] ${lesson.title}`);
      console.log(`      URL: /practice/${categorySlug}/${slug}`);
    }

    console.log('\n✅ Done!');
  } catch (e) {
    console.error('Failed:', e);
  } finally {
    await client.close();
  }
}

seed();
