const authors = [
  {
    id: 1,
    label: "James T. Kirk",
    image: "https://en.wikipedia.org/wiki/File:William_Shatner_Star_Trek.JPG",
  },
  {
    id: 2,
    label: "Spock",
    image:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/f/fa/Leonard_Nimoy_as_Spock_1967.jpg/440px-Leonard_Nimoy_as_Spock_1967.jpg",
  },
];

export function getAuthorById(id) {
  return authors.find((x) => x.id?.toString() === id);
}

export function listAuthors() {
  return authors;
}
