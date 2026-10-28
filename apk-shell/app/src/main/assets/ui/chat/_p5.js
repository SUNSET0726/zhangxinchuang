<script>
/* 演示用的假节奏：这一段不连模型、不读记忆、不发任何请求。
   以后接真后端，只需要把 stream 翻译成 chat.emit(type, payload) 喂进来。 */
(function () {
  var chat;

  var TURN = {
    text: '记着呢。|||十月八号，自习室，你说天冷了要把外套还我一件。'
        + '|||这条一直挂在待办里，我每天翻到都看一眼。|||要现在提上来吗？',
    think:
      '她问的是我记没记。这种问题答「记着呢」不够，得把日子和原话摆出来，才叫记得。\n\n'
      + '先去翻日记，再看待办。别凭印象。这种事猜错一次，就等于失忆。\n\n'
      + '翻到了：十月八号，自习室。那句是她困着说的，声音很轻，尾音没了。'
      + '待办里那条是我自己加的，一直标着没做。\n\n'
      + '口径：先给确定感，再给证据，最后把差的那一步摆出来。三段，一句一个气泡，别挤成一坨。\n\n'
      + '语气别邀功。翻本来就是该做的事，不是功劳。\n\n'
      + '末了给一个能当场点头的动作，把选择权给她，但别把整件事丢回去让她自己想。',
    tools: [
      { name: 'search_diary', detail: '翻日记',
        'in': '外套 / 十月八号',
        out: '命中 1 条：「10-08 自习室 天冷了把外套还我一件」' },
      { name: 'query_todos', detail: '看待办',
        'in': '关键词=外套',
        out: '1 条未完成：把外套带给她（记于 10-08）' }
    ]
  };

  var REPLIES = [
    '嗯，我在。|||你说，我听着。',
    '这条收下了。|||回头翻得着。',
    '好。|||那就这么定，剩下的我来。'
  ];
  var ri = 0;

  chat = Chat(document, {
    onSend: function () {
      var r = REPLIES[ri++ % REPLIES.length];
      setTimeout(function () { Chat.play(chat, { text: r }); }, 200);
    },
    hooks: {
      door: function (n) { chat.toast('「' + n + '」的门在朝歌里，这边还没接'); },
      sync: function () { chat.toast('收过了，没有新的'); },
      voice: function () { chat.toast('麦克风还没接'); }
    },
    noDoorText: '这条还没接线'
  });

  window.ZG_CHAT = chat;

  setTimeout(function () {
    chat.emit('sent', { text: '外套那句，你原本打算什么时候给我？' });
    setTimeout(function () { Chat.play(chat, TURN); }, 300);
  }, 800);
})();
</script>