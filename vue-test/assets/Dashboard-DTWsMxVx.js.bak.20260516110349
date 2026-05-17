import{A as e,D as t,M as n,P as r,R as i,at as a,b as o,h as ee,it as s,n as c,r as te,v as l,w as u,x as d,z as f}from"./api-C3T9E3_k.js";var ne={class:`dashboard-page`},re={class:`dashboard-topbar`},ie=[`disabled`],ae={class:`hero-panel`},oe={class:`hero-metrics`},se={key:0,class:`state-card`},ce={key:1,class:`state-card error`},le={class:`summary-grid`},ue={class:`panel trend-panel`},de={class:`panel-head`},fe={class:`trend-svg`,viewBox:`0 0 320 120`,preserveAspectRatio:`none`,"aria-label":`近七日行为趋势`},pe=[`points`],me=[`points`],he={class:`trend-days`},ge={class:`dashboard-grid`},_e={class:`panel`},ve={class:`bar-list`},ye={class:`bar-meta`},p={class:`bar-track`},m={class:`panel`},h={class:`bar-list`},g={class:`bar-meta`},_={class:`bar-track teal`},v={class:`dashboard-grid`},y={class:`panel`},b={key:0,class:`post-rank`},x=[`onClick`],S={key:1,class:`empty-text`},C={class:`panel`},w={class:`hour-chart`},T=[`title`],E={class:`dashboard-grid`},D={class:`panel`},O={key:0,class:`user-list`},k={key:1,class:`empty-text`},A={class:`panel`},j={key:0,class:`keyword-cloud`},M={key:1,class:`empty-text`},N=`campus-dashboard-runtime-style`,P={__name:`Dashboard`,setup(P){if(typeof document<`u`&&!document.getElementById(N)){let e=document.createElement(`style`);e.id=N,e.textContent=`.dashboard-page {
  min-height: 100vh;
  padding: 12px 12px 92px;
  background:
    radial-gradient(circle at 8% 10%, rgba(59, 130, 246, 0.16), transparent 30%),
    radial-gradient(circle at 94% 18%, rgba(16, 185, 129, 0.16), transparent 28%),
    #eef5fb;
  color: #0f172a;
}

.dashboard-topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 12px 4px 16px;
}

.dashboard-topbar p,
.eyebrow,
.panel-head span {
  margin: 0;
  font-size: 12px;
  color: #64748b;
}

.dashboard-topbar h1,
.panel-head h3 {
  margin: 2px 0 0;
  font-size: 18px;
}

.ghost-back,
.refresh-btn {
  border: 0;
  border-radius: 999px;
  padding: 9px 13px;
  background: rgba(255, 255, 255, 0.86);
  color: #0f172a;
  box-shadow: 0 8px 24px rgba(15, 23, 42, 0.08);
}

.refresh-btn {
  background: #2563eb;
  color: #fff;
}

.refresh-btn:disabled {
  opacity: 0.62;
}

.hero-panel {
  display: grid;
  grid-template-columns: 1.35fr 1fr;
  gap: 18px;
  margin-bottom: 14px;
  padding: 22px;
  border-radius: 28px;
  background: linear-gradient(135deg, rgba(15, 23, 42, 0.96), rgba(30, 64, 175, 0.9));
  color: #fff;
  overflow: hidden;
  position: relative;
}

.hero-panel::after {
  content: "";
  position: absolute;
  inset: auto -80px -110px auto;
  width: 260px;
  height: 260px;
  border-radius: 50%;
  background: rgba(34, 197, 94, 0.24);
  filter: blur(4px);
}

.hero-panel h2 {
  position: relative;
  margin: 8px 0;
  max-width: 520px;
  font-size: clamp(22px, 5vw, 34px);
  line-height: 1.16;
}

.hero-panel p {
  position: relative;
  margin: 0;
  max-width: 560px;
  color: rgba(255, 255, 255, 0.74);
  line-height: 1.7;
}

.hero-metrics {
  position: relative;
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
  align-self: end;
}

.hero-metrics article,
.metric-card,
.panel,
.state-card {
  border: 1px solid rgba(148, 163, 184, 0.18);
  background: rgba(255, 255, 255, 0.88);
  box-shadow: 0 18px 42px rgba(15, 23, 42, 0.08);
  backdrop-filter: blur(14px);
}

.hero-metrics article {
  padding: 14px;
  border-radius: 18px;
  color: #fff;
  background: rgba(255, 255, 255, 0.14);
}

.hero-metrics span,
.metric-card span {
  display: block;
  font-size: 12px;
  opacity: 0.78;
}

.hero-metrics strong,
.metric-card strong {
  display: block;
  margin-top: 4px;
  font-size: 26px;
}

.summary-grid,
.dashboard-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
  margin-bottom: 12px;
}

.dashboard-grid {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.metric-card,
.panel,
.state-card {
  border-radius: 22px;
  padding: 16px;
}

.metric-card small,
.empty-text {
  color: #64748b;
}

.state-card {
  margin: 18px 0;
  text-align: center;
}

.state-card.error {
  color: #b91c1c;
}

.state-card button {
  display: block;
  margin: 12px auto 0;
  border: 0;
  border-radius: 999px;
  padding: 8px 14px;
  background: #b91c1c;
  color: #fff;
}

.panel-head {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
  margin-bottom: 14px;
}

.panel-head strong {
  color: #2563eb;
}

.trend-panel {
  margin-bottom: 12px;
}

.trend-svg {
  width: 100%;
  height: 150px;
  display: block;
}

.trend-days {
  display: flex;
  justify-content: space-between;
  color: #64748b;
  font-size: 12px;
}

.bar-list {
  display: grid;
  gap: 12px;
}

.bar-meta {
  display: flex;
  justify-content: space-between;
  margin-bottom: 6px;
  font-size: 13px;
}

.bar-track {
  height: 10px;
  overflow: hidden;
  border-radius: 999px;
  background: #e2e8f0;
}

.bar-track i {
  display: block;
  height: 100%;
  min-width: 8px;
  border-radius: inherit;
  background: linear-gradient(90deg, #2563eb, #60a5fa);
  transition: width 0.6s ease;
}

.bar-track.teal i {
  background: linear-gradient(90deg, #059669, #34d399);
}

.post-rank {
  display: grid;
  gap: 8px;
}

.post-rank button {
  display: grid;
  grid-template-columns: 30px 1fr;
  gap: 4px 10px;
  width: 100%;
  text-align: left;
  border: 0;
  border-radius: 16px;
  padding: 10px;
  background: #f8fafc;
  color: #0f172a;
}

.post-rank b {
  grid-row: span 2;
  width: 28px;
  height: 28px;
  display: grid;
  place-items: center;
  border-radius: 50%;
  color: #fff;
  background: #2563eb;
}

.post-rank span {
  font-weight: 700;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.post-rank small {
  color: #64748b;
}

.hour-chart {
  height: 160px;
  display: grid;
  grid-template-columns: repeat(24, minmax(4px, 1fr));
  gap: 4px;
  align-items: end;
}

.hour-chart span {
  height: 100%;
  display: flex;
  align-items: end;
}

.hour-chart i {
  width: 100%;
  border-radius: 999px 999px 4px 4px;
  background: linear-gradient(180deg, #f59e0b, #f97316);
}

.user-list {
  display: grid;
  gap: 10px;
}

.user-list div {
  display: flex;
  justify-content: space-between;
  padding: 10px 12px;
  border-radius: 14px;
  background: #f8fafc;
}

.keyword-cloud {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.keyword-cloud span {
  padding: 8px 12px;
  border-radius: 999px;
  background: #eff6ff;
  color: #1d4ed8;
}

.keyword-cloud b {
  margin-left: 4px;
}

@media (max-width: 760px) {
  .dashboard-page {
    padding: 10px 10px 96px;
  }

  .hero-panel,
  .summary-grid,
  .dashboard-grid {
    grid-template-columns: 1fr;
  }

  .hero-metrics {
    grid-template-columns: repeat(3, 1fr);
  }

  .summary-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}`,document.head.appendChild(e)}let F=ee(),I=te(),L=i({}),R=i(!0),z=i(``),B=i({}),V=o(()=>{let e=L.value.summary||{};return{posts:Number(e.posts??L.value.post_count??0),users:Number(e.users??L.value.user_count??0),comments:Number(e.comments??L.value.comment_count??0),likes:Number(e.likes??L.value.like_count??0),todayPosts:Number(e.today_posts??0),todayComments:Number(e.today_comments??0),behaviorEvents:Number(e.behavior_events??0),activeUsers7d:Number(e.active_users_7d??0),searches7d:Number(e.searches_7d??0),views7d:Number(e.views_7d??0)}}),be=o(()=>[{key:`posts`,label:`帖子`,value:V.value.posts},{key:`comments`,label:`评论`,value:V.value.comments},{key:`behaviorEvents`,label:`行为`,value:V.value.behaviorEvents}]),xe=o(()=>[{key:`users`,label:`注册用户`,value:V.value.users,hint:`累计注册账号`},{key:`likes`,label:`点赞互动`,value:V.value.likes,hint:`累计点赞次数`},{key:`activeUsers7d`,label:`近 7 日活跃`,value:V.value.activeUsers7d,hint:`有行为记录的用户`},{key:`views7d`,label:`近 7 日浏览`,value:V.value.views7d,hint:`帖子浏览行为`}]),H=o(()=>L.value.hot_posts||L.value.top_posts||[]),U=o(()=>L.value.content_segments||L.value.category_stats||[]),W=o(()=>L.value.behavior_focus||L.value.behavior_mix||[]),G=o(()=>L.value.behavior_trend||[]),K=o(()=>L.value.hourly_activity||[]),q=o(()=>L.value.active_users||[]),J=o(()=>L.value.top_keywords||[]),Se=o(()=>X(U.value,`total`,`count`)),Ce=o(()=>X(W.value,`total`)),we=o(()=>X(K.value,`total`)),Te=o(()=>G.value.reduce((e,t)=>e+Number(t.total||0),0)),Ee=o(()=>X(G.value,`total`)),De=o(()=>Q(!1)),Y=o(()=>Q(!0));function X(e,t,n){return Math.max(1,...e.map(e=>Number(e[t]??e[n]??0)))}function Z(e,t){return Math.min(100,Math.round(Number(e||0)/Math.max(1,t)*100))}function Oe(e){if(!e)return``;let t=String(e).split(`-`);return t.length>=3?`${Number(t[1])}/${Number(t[2])}`:e}function ke(e){return{search:`搜索行为`,view_post:`浏览行为`,like_post:`点赞反馈`,unlike_post:`取消点赞`,comment_post:`评论参与`,create_post:`发帖行为`,browse_category:`内容停留`}[e]||`其他行为`}function Q(e){let t=G.value.length?G.value:[{total:0}],n=Math.max(1,Ee.value),r=t.length>1?320/(t.length-1):320,i=t.map((e,t)=>`${Math.round(t*r)},${Math.round(110-Number(e.total||0)/n*88-10)}`);return e?`0,120 ${i.join(` `)} 320,120`:i.join(` `)}function Ae(){let e={posts:V.value.posts,users:V.value.users,comments:V.value.comments,likes:V.value.likes,behaviorEvents:V.value.behaviorEvents,activeUsers7d:V.value.activeUsers7d,views7d:V.value.views7d},t=performance.now(),n=r=>{let i=Math.min(1,(r-t)/720),a=1-(1-i)**3;B.value=Object.fromEntries(Object.entries(e).map(([e,t])=>[e,Math.round(t*a)])),i<1&&requestAnimationFrame(n)};requestAnimationFrame(n)}async function $(){R.value=!0,z.value=``;try{let e=I.isAdmin?I.userId:0;L.value=(await c.getPublicDashboardStats(e)).data||{},Ae()}catch(e){console.error(e),z.value=e.message||`统计接口异常`}finally{R.value=!1}}return e($),(e,i)=>(n(),u(`div`,ne,[d(`header`,re,[d(`button`,{class:`ghost-back`,onClick:i[0]||=e=>f(F).back()},`← 返回`),i[1]||=d(`div`,null,[d(`p`,null,`校园论坛`),d(`h1`,null,`数据分析`)],-1),d(`button`,{class:`refresh-btn`,disabled:R.value,onClick:$},a(R.value?`刷新中`:`刷新`),9,ie)]),d(`section`,ae,[i[2]||=d(`div`,null,[d(`span`,{class:`eyebrow`},`实时运营看板`),d(`h2`,null,`把发帖、互动和访问行为集中成可读数据。`),d(`p`,null,` 数据来自帖子、评论、点赞、浏览和搜索行为日志，用于观察论坛活跃度、内容结构和用户参与情况。 `)],-1),d(`div`,oe,[(n(!0),u(l,null,r(be.value,e=>(n(),u(`article`,{key:e.key},[d(`span`,null,a(e.label),1),d(`strong`,null,a(B.value[e.key]??e.value),1)]))),128))])]),R.value?(n(),u(`div`,se,`正在读取统计数据...`)):z.value?(n(),u(`div`,ce,[i[3]||=d(`strong`,null,`数据加载失败`,-1),d(`span`,null,a(z.value),1),d(`button`,{onClick:$},`重新加载`)])):(n(),u(l,{key:2},[d(`section`,le,[(n(!0),u(l,null,r(xe.value,e=>(n(),u(`article`,{key:e.key,class:`metric-card`},[d(`span`,null,a(e.label),1),d(`strong`,null,a(B.value[e.key]??e.value),1),d(`small`,null,a(e.hint),1)]))),128))]),d(`section`,ue,[d(`div`,de,[i[4]||=d(`div`,null,[d(`span`,null,`近 7 日趋势`),d(`h3`,null,`行为活跃度`)],-1),d(`strong`,null,a(Te.value)+` 次行为`,1)]),(n(),u(`svg`,fe,[i[5]||=d(`defs`,null,[d(`linearGradient`,{id:`trendFill`,x1:`0`,y1:`0`,x2:`0`,y2:`1`},[d(`stop`,{offset:`0%`,"stop-color":`#2563eb`,"stop-opacity":`0.26`}),d(`stop`,{offset:`100%`,"stop-color":`#2563eb`,"stop-opacity":`0`})])],-1),d(`polygon`,{points:Y.value,fill:`url(#trendFill)`},null,8,pe),d(`polyline`,{points:De.value,fill:`none`,stroke:`#2563eb`,"stroke-width":`4`,"stroke-linecap":`round`,"stroke-linejoin":`round`},null,8,me)])),d(`div`,he,[(n(!0),u(l,null,r(G.value,e=>(n(),u(`span`,{key:e.log_date},a(Oe(e.log_date)),1))),128))])]),d(`section`,ge,[d(`article`,_e,[i[6]||=d(`div`,{class:`panel-head`},[d(`div`,null,[d(`span`,null,`内容结构`),d(`h3`,null,`内容类型分布`)])],-1),d(`div`,ve,[(n(!0),u(l,null,r(U.value,e=>(n(),u(`div`,{key:e.label,class:`bar-row`},[d(`div`,ye,[d(`span`,null,a(e.label),1),d(`strong`,null,a(e.total),1)]),d(`div`,p,[d(`i`,{style:s({width:Z(e.total,Se.value)+`%`})},null,4)])]))),128))])]),d(`article`,m,[i[7]||=d(`div`,{class:`panel-head`},[d(`div`,null,[d(`span`,null,`用户行为`),d(`h3`,null,`行为类型占比`)])],-1),d(`div`,h,[(n(!0),u(l,null,r(W.value,e=>(n(),u(`div`,{key:e.behavior_type,class:`bar-row`},[d(`div`,g,[d(`span`,null,a(e.label||ke(e.behavior_type)),1),d(`strong`,null,a(e.total),1)]),d(`div`,_,[d(`i`,{style:s({width:Z(e.total,Ce.value)+`%`})},null,4)])]))),128))])])]),d(`section`,v,[d(`article`,y,[i[8]||=d(`div`,{class:`panel-head`},[d(`div`,null,[d(`span`,null,`热门内容`),d(`h3`,null,`互动较高帖子`)])],-1),H.value.length?(n(),u(`div`,b,[(n(!0),u(l,null,r(H.value,(e,t)=>(n(),u(`button`,{key:e.id,onClick:t=>f(F).push(`/post/${e.id}`)},[d(`b`,null,a(t+1),1),d(`span`,null,a(e.title||e.content||`未命名帖子`),1),d(`small`,null,a(e.view_count||0)+` 浏览 · `+a(e.like_count||0)+` 赞 · `+a(e.comment_count||0)+` 评论`,1)],8,x))),128))])):(n(),u(`p`,S,`暂无热门帖子数据`))]),d(`article`,C,[i[9]||=d(`div`,{class:`panel-head`},[d(`div`,null,[d(`span`,null,`活跃时段`),d(`h3`,null,`24 小时行为分布`)])],-1),d(`div`,w,[(n(!0),u(l,null,r(K.value,e=>(n(),u(`span`,{key:e.hour_slot,title:`${e.label} ${e.total} 次`},[d(`i`,{style:s({height:Math.max(8,Z(e.total,we.value)*.78)+`%`})},null,4)],8,T))),128))])])]),d(`section`,E,[d(`article`,D,[i[10]||=d(`div`,{class:`panel-head`},[d(`div`,null,[d(`span`,null,`活跃用户`),d(`h3`,null,`近 30 日参与排行`)])],-1),q.value.length?(n(),u(`div`,O,[(n(!0),u(l,null,r(q.value,e=>(n(),u(`div`,{key:e.user_id},[d(`span`,null,a(e.nickname||`用户${e.user_id}`),1),d(`strong`,null,a(e.active_score||e.total_events||0),1)]))),128))])):(n(),u(`p`,k,`暂无活跃用户数据`))]),d(`article`,A,[i[11]||=d(`div`,{class:`panel-head`},[d(`div`,null,[d(`span`,null,`搜索热词`),d(`h3`,null,`高频关键词`)])],-1),J.value.length?(n(),u(`div`,j,[(n(!0),u(l,null,r(J.value,e=>(n(),u(`span`,{key:e.keyword},[t(a(e.keyword)+` `,1),d(`b`,null,a(e.total),1)]))),128))])):(n(),u(`p`,M,`暂无达到展示条件的搜索词`))])])],64))]))}};export{P as default};