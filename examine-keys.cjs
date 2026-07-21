async function test() {
  const url = `https://pharmaciens.tg/api/pharmcies?populate=*&pagination[page]=1&pagination[pageSize]=10`;
  const res = await fetch(url);
  const data = await res.json();
  for (const item of data.data) {
    console.log({
      titre: item.titre,
      tel: item.adresse?.telephone,
      addr: item.adresse?.adresse
    });
  }
}
test();
