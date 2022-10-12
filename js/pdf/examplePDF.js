/**
 * Created by jf on 2015/9/11.
 * Modified by bear on 2016/9/7.
 */
// const footerTmpl = $('#footerTmpl').html();
$(() => {
  const pageManager = {
    $container: $('#container'),
    _pageStack: [],
    _configs: [],
    _pageAppend() {},
    _defaultPage: null,
    _pageIndex: 1,
    setDefault(defaultPage) {
      this._defaultPage = this._find('name', defaultPage);
      return this;
    },
    setPageAppend(pageAppend) {
      this._pageAppend = pageAppend;
      return this;
    },
    init() {
      const self = this;

      $(window).on('hashchange', () => {
        const state = history.state || {};
        const url = location.hash.indexOf('#') === 0 ? location.hash : '#';
        const page = self._find('url', url) || self._defaultPage;
        if (state._pageIndex <= self._pageIndex || self._findInStack(url)) {
          self._back(page);
        } else {
          self._go(page);
        }
      });

      if (history.state && history.state._pageIndex) {
        this._pageIndex = history.state._pageIndex;
      }

      this._pageIndex -= 1;

      const url = location.hash.indexOf('#') === 0 ? location.hash : '#';
      const page = self._find('url', url) || self._defaultPage;
      this._go(page);
      return this;
    },
    push(config) {
      this._configs.push(config);
      return this;
    },
    go(to) {
      const config = this._find('name', to);
      if (!config) {
        return;
      }
      location.hash = config.url;
    },
    _go(config) {
      this._pageIndex += 1;

      history.replaceState && history.replaceState({ _pageIndex: this._pageIndex }, '', location.href);

      const html = $(config.template).html();
      const $html = $(html).addClass('slideIn')
        .addClass(config.name);
      $html.on('animationend webkitAnimationEnd', () => {
        $html.removeClass('slideIn').addClass('js_show');
        setPageA11y();
        const event = new Event('switched');
        window.dispatchEvent(event);
      });

      this.$container.append($html);
      this._pageAppend.call(this, $html);
      this._pageStack.push({
        config,
        dom: $html,
      });

      if (!config.isBind) {
        this._bind(config);
      }

      return this;
    },
    back() {
      history.back();
    },
    _back(config) {
      this._pageIndex -= 1;

      const stack = this._pageStack.pop();
      if (!stack) {
        return;
      }

      const url = location.hash.indexOf('#') === 0 ? location.hash : '#';
      const found = this._findInStack(url);
      if (!found) {
        const html = $(config.template).html();
        const $html = $(html).addClass('js_show')
          .addClass(config.name);
        $html.insertBefore(stack.dom);

        if (!config.isBind) {
          this._bind(config);
        }

        this._pageStack.push({
          config,
          dom: $html,
        });
      }

      stack.dom.addClass('slideOut').on('animationend webkitAnimationEnd', () => {
        stack.dom.remove();
        setPageA11y();
      });

      return this;
    },
    _findInStack(url) {
      let found = null;
      for (let i = 0, len = this._pageStack.length; i < len; i++) {
        const stack = this._pageStack[i];
        if (stack.config.url === url) {
          found = stack;
          break;
        }
      }
      return found;
    },
    _find(key, value) {
      let page = null;
      for (let i = 0, len = this._configs.length; i < len; i++) {
        if (this._configs[i][key] === value) {
          page = this._configs[i];
          break;
        }
      }
      return page;
    },
    _bind(page) {
      const events = page.events || {};
      for (const t in events) {
        for (const type in events[t]) {
          this.$container.on(type, t, events[t][type]);
        }
      }
      page.isBind = true;
    },
  };
  function androidInputBugFix() {
    // .container 设置了 overflow 属性, 导致 Android 手机下输入框获取焦点时, 输入法挡住输入框的 bug
    // 相关 issue: https://github.com/weui/weui/issues/15
    // 解决方法:
    // 0. .container 去掉 overflow 属性, 但此 demo 下会引发别的问题
    // 1. 参考 http://stackoverflow.com/questions/23757345/android-does-not-correctly-scroll-on-input-focus-if-not-body-element
    //    Android 手机下, input 或 textarea 元素聚焦时, 主动滚一把
    if (/Android/gi.test(navigator.userAgent)) {
      window.addEventListener('resize', () => {
        if (document.activeElement.tagName == 'INPUT' || document.activeElement.tagName == 'TEXTAREA') {
          window.setTimeout(() => {
            document.activeElement.scrollIntoViewIfNeeded();
          }, 0);
        }
      });
    }
  }
  
  function setPageManager() {
    const pages = {}; const tpls = $('script[type="text/html"]');

    for (let i = 0, len = tpls.length; i < len; ++i) {
      const tpl = tpls[i]; const name = tpl.id.replace(/tpl_/, '');
      pages[name] = {
        name,
        url: `#${name}`,
        template: `#${tpl.id}`,
      };
    }
    pages.home.url = '#';

    for (const page in pages) {
      pageManager.push(pages[page]);
    }
    pageManager
      .setPageAppend(($html) => {
        // $html.eq(0).append(footerTmpl);
        // setTimeout(() => {
        //   const $foot = $html.find('.page__ft');
        //   if ($foot.length < 1) return;

        //   const winH = $(window).height();
        //   if ($foot.position().top + $foot.height() < winH) {
        //     $foot.addClass('j_bottom');
        //   } else {
        //     $foot.removeClass('j_bottom');
        //   }
        // });
      })
      .setDefault('home')
      .init();
  }
  function setPageA11y() {
    const $pages = $('.page');
    const $lastPage = $pages.eq($pages.length - 1);

    $pages.attr('aria-hidden', 'true'); // 所有page都加
    $lastPage.removeAttr('aria-hidden').attr('tabindex', '-1')
      .trigger('focus'); // 最后一个page不用加
  }
  function init() {
    // preload();
    androidInputBugFix();
    // setJSAPI();
    setPageManager();

    window.pageManager = pageManager;
    window.home = function () {
      location.hash = '';
    };
  }
  init();
});


 