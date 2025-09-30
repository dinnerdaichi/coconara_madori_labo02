const gulp = require('gulp');
const fs = require('fs');
const path = require('path');
const ejs = require('gulp-ejs');
const rename = require('gulp-rename');
const yargs = require('yargs/yargs');
const { hideBin } = require('yargs/helpers');
const replace = require('gulp-replace');
const postcss = require('gulp-postcss');
const sorting = require('postcss-sorting');
// const scss = require('postcss-scss');
const scssParser = require('postcss-scss');
const argv = yargs(hideBin(process.argv)).argv;
const purgecss = require('gulp-purgecss');
const through = require('through2');


// Sassファイルとディレクトリの自動生成タスク
gulp.task('create', function (done) {
  // 基本的なフォルダ構成
  const folders = [
    'sass',
    'img',
    'css',
    'js',
    'sass/foundation',
    'sass/layout',
    'sass/object/component',
    'sass/object/project'
  ];

  // 各フォルダを作成
  folders.forEach(folder => {
    const folderPath = path.join(__dirname, 'assets', folder);
    if (!fs.existsSync(folderPath)) {
      fs.mkdirSync(folderPath, { recursive: true });
    }
  });


  // Foundationフォルダにmixin.scssを作成
  const foundationFiles = ['_functions.scss', '_mixin.scss'];
  foundationFiles.forEach(file => {
    const filePath = path.join(__dirname, 'assets', 'sass', 'foundation', file);
    if (file === '_functions.scss') {

      const functionsContent = `// プロジェクト共通の縮小開始値をここで決める
$projectMaxViewport: 1920;

@function rclamp($value, $minSize: null) {
  $max: $value;
  $maxViewport: $projectMaxViewport; // ここで固定！
  $minViewport: 768; // 縮小開始pxは固定でもよければここ
  $scale: $max / $maxViewport;
  $autoMin: $scale * $minViewport;
  $min: if($minSize != null, $minSize, $autoMin);
  $minRem: $min / 16;
  $maxRem: $max / 16;
  $scaleRem: $scale * 100;
  @return clamp(#{$minRem}rem, #{$scaleRem}vw, #{$maxRem}rem);
}
@function rclamp-negative($value, $valueViewport, $minSize: null) {
  $value-rem: $value / 16;
  $start: 1360;
  $end: 768;
  $base: 1920;

  $scale: $value / $valueViewport;
  $ratio: $end / $base;
  $min: $value * $ratio;
  $min-rem: $min / 16;
  $scaleRem: $scale * 100;
  $slope: (
    $min-rem - $value-rem) / ($start - $end) * 100;
  @return clamp(#{$value-rem}rem, #{$scaleRem}vw, #{$min-rem}rem
);
}

@function vw-sp($px, $base: 375) {

  $num: if(unitless($px), $px, strip-unit($px));
  $vw: $num / $base * 100;

  @return #{$vw}vw;
}



:root {
  --color-bg-beige: #f8ebdd;
  --color-bg-brown: #47332f;
  --color-text-brown: #894840;
  --color-orange: #f39800;
  --color-blue: #131855;
  --bg-: #;
  --bg-: #;
}
      `;
      fs.writeFileSync(filePath, functionsContent);

    } else if (file === '_mixin.scss') {
      const mixinContent = `$breakpoint: (
  sp: 'screen and (max-width:767px)',
  tab: 'screen and (max-width:900px)',
  pc: 'screen and (min-width:901px)'
);

@mixin mq($bp) {
  @media #{map-get($breakpoint, $bp)} {
    @content;
  }
}`;
      fs.writeFileSync(filePath, mixinContent);  // 内容を追加してファイルを作成
    } else {
      fs.writeFileSync(filePath, '');  // 空ファイルを作成
    }
  });

  // Object/Projectフォルダ内のファイルを作成
  const projectFiles = ['_main.scss'];
  projectFiles.forEach(file => {
    const filePath = path.join(__dirname, 'assets', 'sass', 'object', 'project', file);
    const projectContent = `@use "../../foundation/mixin" as m;
@use "../../foundation/functions" as *;`;
    fs.writeFileSync(filePath, projectContent);  // 内容を追加してファイルを作成
  });

  // Object/Componentフォルダ内のファイルを作成
  const componentFiles = ['_swiper.scss'];
  componentFiles.forEach(file => {
    const filePath = path.join(__dirname, 'assets', 'sass', 'object', 'component', file);
    const componentContent = `@use "../../foundation/mixin" as m;
@use "../../foundation/functions" as *;`;
    fs.writeFileSync(filePath, componentContent);  // 内容を追加してファイルを作成
  });

  // layoutフォルダにファイルを作成
  const layoutFiles = ['_header.scss', '_footer.scss'];
  layoutFiles.forEach(file => {
    const filePath = path.join(__dirname, 'assets', 'sass', 'layout', file);
    const layoutContent = `@use "../foundation/mixin" as m;
@use "../foundation/functions" as *;`; // 修正：../に変更
    fs.writeFileSync(filePath, layoutContent);  // 内容を追加してファイルを作成
  });

  // style.scssを作成
  const styleFilePath = path.join(__dirname, 'assets', 'sass', 'style.scss');
  const styleContent = `

/*--------------------------------------*
    * layout
*--------------------------------------*/
@use "./layout/header";
@use "./layout/footer";

/*--------------------------------------*
    * component
*--------------------------------------*/

@use "./object/component/swiper";

/*--------------------------------------*
    * project
*--------------------------------------*/
@use "./object/project/main";`;

  fs.writeFileSync(styleFilePath, styleContent);

  // ルート直下にindex.htmlを作成（空ファイル）
  const indexFilePath = path.join(__dirname, 'index.html');
  fs.writeFileSync(indexFilePath, ''); // 空ファイルを作成


  // jsフォルダにscript.jsを作成（空ファイル）
  const scriptFilePath = path.join(__dirname, 'assets', 'js', 'script.js');
  fs.writeFileSync(scriptFilePath, ''); // 空ファイルを作成

  done();
});

// EJSテンプレートをHTMLにコンパイルするタスク
gulp.task('ejs', () => {
  if (!argv.ejs) return;  // EJSの処理をスキップする場合
  return gulp.src('./assets/ejs/**/*.ejs')
    .pipe(ejs({}, {}, { ext: '.html' }).on('error', console.error))
    .pipe(rename({ extname: '.html' }))
    .pipe(gulp.dest('./assets/dist'));
});

// 監視タスク
gulp.task('watch', () => {
  if (argv.ejs) {
    gulp.watch('./assets/ejs/**/*.ejs', gulp.series('ejs')); // EJSテンプレートの監視
  }
  // 他の監視設定があればここに追加
});

// デフォルトタスク
gulp.task('default', () => {
  const tasks = [];
  if (argv.ejs) {
    tasks.push('ejs');
  }
  tasks.push('watch');
  return gulp.series(...tasks)();
});


// scssの整形
const sassFiles = 'assets/**/*.scss';

gulp.task('scss', function () {
  return gulp.src(sassFiles, { base: './' })
    .pipe(postcss([
      sorting({
        'properties-order': [
          'position', 'top', 'right', 'bottom', 'left', 'z-index',
          'display', 'flex', 'grid', 'float', 'clear',
          'width', 'height', 'max-width', 'max-height', 'min-width', 'min-height',
          'margin', 'padding', 'border', 'box-sizing',
          'background', 'background-color', 'background-image',
          'font-family', 'font-size', 'font-weight', 'line-height', 'color', 'text-align',
          'opacity', 'visibility', 'overflow', 'cursor', 'transition'
        ],
        'unspecified-properties-position': 'bottom'
      })
    ], { parser: scssParser }))
    .pipe(replace(/^\s*\/\/.*\n?/gm, ''))
    .pipe(replace(/^\s*\n/gm, ''))
    .pipe(gulp.dest('./'));
});

// テーマ名入力
const themeName = 'camel';

// WordPressのパス置換
gulp.task('path', function () {
  return gulp.src(`wp-content/themes/${themeName}/**/*.php`, { base: './' })

     // imgタグのsrc置換
    .pipe(replace(/(<img[^>]*src=["'])\.?\/?assets\/img\/(.*?)["']/g, (match, p1, p2) => {
      if (match.includes('get_template_directory_uri')) return match;
      return `${p1}<?php echo get_template_directory_uri(); ?>/assets/img/${p2}"`;
    }))

    // scriptタグのsrc置換
    .pipe(replace(/<script\s+src=["']\.?\/?assets\/js\/(.*?)["']><\/script>/g, (match, p1) => {
      if (match.includes('get_template_directory_uri')) return match;
      return `<script src="<?php echo get_template_directory_uri(); ?>/assets/js/${p1}"></script>`;
    }))

    // linkタグのhref置換（CSS）
    .pipe(replace(/<link\s+rel=["']stylesheet["']\s+href=["']\.?\/?assets\/css\/(.*?)["']>/g, (match, p1) => {
      if (match.includes('get_template_directory_uri')) return match;
      return `<link rel="stylesheet" href="<?php echo get_template_directory_uri(); ?>/assets/css/${p1}">`;
    }))

    .pipe(gulp.dest('./')); // 元ファイルに上書き✨
});

// 各ファイルの整形
gulp.task('clean', function () {
  // 基本パス（assets以下）
  const paths = [
    'assets/**/*.js',
    'assets/**/*.scss',
    'assets/**/*.html',
    '!node_modules/**',
    '!gulpfile.js'
  ];

  // WordPressテーマがあればPHPも追加
  const themePath = `wp-content/themes/${themeName}/**/*.php`;
  if (fs.existsSync(`wp-content/themes/${themeName}`)) {
    paths.push(themePath);
  }

  return gulp.src(paths, { base: './' })
    .pipe(replace(/^\s*\/\/.*\n?/gm, ''))         // JSやSCSSの1行コメント
    .pipe(replace(/\/\*[\s\S]*?\*\//gm, ''))      // JS/SCSSの複数行コメント
    .pipe(replace(/<!--[\s\S]*?-->/gm, ''))       // HTML/PHPのコメント
    .pipe(replace(/^\s*\n/gm, ''))                // 空行
    .pipe(gulp.dest('./'));                       // 上書き保存！
});

// 未使用セレクタ検出
gulp.task('check-unused-css', () => {
  return gulp.src('assets/**/*.css')
    .pipe(purgecss({
      content: ['./*.html', 'assets/**/*.js', 'assets/**/*.php'],
      // safelist: [], 必要に応じて追加
    }))
    .pipe(through.obj((file, enc, cb) => {
      if (file.purgecss && file.purgecss.rejected && file.purgecss.rejected.length) {
        console.log(`未使用セレクタ in ${file.relative}:`);
        console.log(file.purgecss.rejected.join('\n'));
      }
      cb(null, file);
    }));
});