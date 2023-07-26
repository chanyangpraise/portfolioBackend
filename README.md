# Portfolio_Backend
김민홍 DB <br/>
김정겸 Backend <br/>
스키마 = Plan.mwb <br/><br/>

### routes 폴더 <br/>
board.js = 게시물 작성, 수정, 삭제, 게시글 Like 추가, 취소, 조회 기능 구현 / 게시물과 관련된 페이징 처리 <br/>
comment.js = 댓글 작성, 수정, 삭제 기능 구현 / 댓글과 관련된 페이징 처리 <br/>
re_comment.js = 대댓글 작성, 수정, 삭제 기능 구현 / 대댓글과 관련된 페이징 처리 <br/>
profile.js = 프로필 조회, 팔로잉, 팔로워 조회 기능 구현 / 페이징 처리 추가 <br/>
users.js = 이메일 인증, 로그인, 비밀번호 변경, 프로필 이미지 업로드, 수정, 삭제 기능 구현
<br/><br/>

### functions 폴더 <br/>
db.js = createPool로 DB와 연결하는 함수 구현 <br/>
multer.js = S3 multer를 이용하여 게시물과 프로필 이미지를 S3에 업로드하는 함수 구현 <br/>
delete.js = 게시물, 프로필 이미지를 S3에서 삭제하는 함수 구현 <br/>
mail.js = nodemailer를 이용하여 인증 로직 및 발송 함수 구현 <br/>
encrypt.js = 암호화 함수
<br/><br/>

### 전체적 수정사항 <br/>
Promise를 사용한 비동기 처리 <br/>
파라미터화를 통한 SQL 인젝션 방어 <br/>
