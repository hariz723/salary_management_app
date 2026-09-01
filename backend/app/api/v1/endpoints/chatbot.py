from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.schemas.chatbot import ChatbotQueryRequest, ChatbotQueryResponse
from app.services import chatbot_service

router = APIRouter()


@router.post(
    "/query",
    response_model=ChatbotQueryResponse,
    status_code=status.HTTP_200_OK,
    summary="Query compensation and workforce dataset using natural language",
)
def query_compensation_chatbot(
    payload: ChatbotQueryRequest,
    db: Session = Depends(get_db),
):
    return chatbot_service.answer_chatbot_query(db, payload.message)
