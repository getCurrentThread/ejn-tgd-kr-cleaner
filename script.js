/* asyncPool https://github.com/rxaviers/async-pool/blob/master/lib/es7.js */
async function asyncPool(poolLimit, array, iteratorFn) {
    const ret = [];
    const executing = [];
    for (const item of array) {
      const p = Promise.resolve().then(() => iteratorFn(item, array));
      ret.push(p);
  
      if (poolLimit <= array.length) {
        const e = p.then(() => executing.splice(executing.indexOf(e), 1));
        executing.push(e);
        if (executing.length >= poolLimit) {
          await Promise.race(executing);
        }
      }
    }
    return Promise.all(ret);
  }


// 내가 쓴 게시글 삭제
(async () => {
    try {
        while(true){
            await fetch("https://tgd.kr/member/mylist/article")
                .then((response) => response.text())
                .then((text) => {
                    // parse text to html
                    const parser = new DOMParser();
                    const doc = parser.parseFromString(text, "text/html");
                    const list = [...doc.querySelectorAll("#main-content table > tbody > tr > th")].map(x => x.innerText);
                    if(list.length === 0){
                        throw Error("더 이상 글이 없거나, recaptcha 문제로 인해 종료합니다.");
                    }
                    return list;
                })
                .then(list => {
                    return asyncPool(2, list, async (page) => {
                        console.log(`${page}번 게시글 삭제 진행중...`);
                        return fetch(`https://tgd.kr/board/delete/${page}?sure=1`, {
                            "headers": {
                            "content-type": "application/x-www-form-urlencoded",
                            },
                            "method": "POST",
                            "redirect": "manual"
                        });
                        }
                    )
                })
        }
    }
    catch (error) {
        console.error("내가 쓴 게시글 삭제에 오류가 발생하였습니다. 오류 내용: " + error);
    }
})();

// 내가 쓴 댓글 삭제
(async () => {
    try {
        while(true){
            await fetch("https://tgd.kr/member/mylist/comment")
                .then((response) => response.text())
                .then((text) => {
                    // parse text to html
                    const parser = new DOMParser();
                    const doc = parser.parseFromString(text, "text/html");
                    const list = [...doc.querySelectorAll("#main-content table > tbody > tr > td > a")].map(x => x.href).map(x => x.match(/(\d){1,}/g)[1]);
                    if(list.length === 0){
                        throw Error("더 이상 댓글이 없거나, recaptcha 문제로 인해 종료합니다.");
                    }
                    return list;
                })
                .then(list => {
                    return asyncPool(2, list, async (page) => {
                        console.log(`${page}번 댓글 삭제 진행중...`);
                        return fetch(`https://tgd.kr/board/comment_delete/${page}?ajax=1`);
                    })
                })
        }
    }
    catch (error) {
        console.error("내가 쓴 댓글 삭제에 오류가 발생하였습니다. 오류 내용: " + error);
    }
})();