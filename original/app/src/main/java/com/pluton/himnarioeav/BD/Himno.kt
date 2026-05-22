data class Himno(
    val id: Int,
    val numero: String,
    val nombre: String,
    val letra: String,
    val categoria: String,
    val aud: List<Audio>, // Usa List<Audio> para representar la lista de audios
    val page: String,
    val nuevo: Int
)

data class Audio(
    val src: String,
    val id: String,
    val lang: String
)
